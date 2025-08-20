require "net/http"
require "uri"

class Api::V1::SpacesController < ApplicationController
  before_action :authenticate_user!

  def index
    filter = params[:filter].to_s.presence || "all"
    limit = [ [ params[:limit].to_i, 0 ].max, 50 ].min rescue 20
    limit = 20 if limit.zero?

    base_scope = spaces_scope_for_filter(filter).active

    # Use last activity time: latest transaction time, or space creation time if no transactions
    last_tx_expr = last_activity_expr_sql

    scoped = base_scope
      .select("spaces.*, (#{last_tx_expr}) AS last_transaction_at, my_membership.role AS current_user_role")
      .joins(ActiveRecord::Base.send(:sanitize_sql_array, [
        "LEFT JOIN space_memberships AS my_membership ON my_membership.space_id = spaces.id AND my_membership.user_id = ?",
        current_user.id
      ]))
      .includes(:created_by)

    order_sql = <<~SQL.squish
      last_transaction_at DESC NULLS LAST, spaces.name ASC, spaces.created_by_id ASC, spaces.id ASC
    SQL

    if (raw_cursor = params[:cursor]).present?
      cursor = decode_cursor(raw_cursor)
      scoped = apply_cursor(scoped, cursor, last_tx_expr) if cursor_valid?(cursor)
    end

    records = scoped.order(order_sql).limit(limit + 1)

    has_more = records.length > limit
    records = records.first(limit)

    last_cursor = records.last ? encode_cursor(records.last) : nil

    render json: {
      spaces: records.map { |s| serialize_space(s) },
      lastCursor: last_cursor,
      hasMore: has_more
    }
  end

  def limits
    plan = current_user.plan
    # Count includes spaces pending deletion to avoid loopholes
    created_spaces_count = current_user.created_spaces_count
    render json: {
      maxSpaces: plan.max_spaces,
      createdSpacesCount: created_spaces_count,
      canCreateMore: created_spaces_count < plan.max_spaces
    }
  end

  def create
    plan = current_user.plan
    if current_user.created_spaces_count >= plan.max_spaces
      render json: { error: "You have reached the maximum number of spaces for your plan." }, status: :unprocessable_content
      return
    end

    name = params[:name].to_s.strip
    description = params[:description].to_s.strip.presence

    space = Space.new(name: name, description: description, created_by: current_user)

    begin
      Space.transaction do
        space.save!
        SpaceMembership.create!(user: current_user, space: space, role: "admin")
      end
    rescue ActiveRecord::RecordInvalid => e
      render json: { errors: space.errors.full_messages.presence || [ e.record.errors.full_messages.presence || e.message ].flatten }, status: :unprocessable_content
      return
    rescue ActiveRecord::RecordNotUnique
      render json: { errors: [ "Name has already been taken。" ] }, status: :unprocessable_content
      return
    end

    render json: {
      space: {
        id: space.id,
        name: space.name,
        description: space.description,
        createdAt: space.created_at,
        colorHex: space.color_hex
      }
    }, status: :created
  end

  def check_name
    name = params[:name].to_s.strip
    if name.blank?
      render json: { available: false }
      return
    end

    exists = Space.where(created_by_id: current_user.id).where("LOWER(name) = ?", name.downcase).exists?
    render json: { available: !exists }
  end

  # Invite a user by email to a space where the current user is an admin.
  def invite
    admin_membership = SpaceMembership.includes(:space).find_by(space_id: params[:id], user_id: current_user.id, role: "admin")
    unless admin_membership && admin_membership.space.deleted_at.nil?
      render json: { error: "Space not found" }, status: :not_found
      return
    end
    space = admin_membership.space

    invitee_email = params[:email].to_s.strip.downcase
    if invitee_email.blank?
      render json: { error: "Email is required" }, status: :unprocessable_content
      return
    end

    invitee = User.where("LOWER(email) = ?", invitee_email).first
    unless invitee
      render json: { error: "The user to invite does not exist in the system." }, status: :unprocessable_content
      return
    end

    if invitee.id == current_user.id
      render json: { error: "You cannot invite yourself." }, status: :unprocessable_content
      return
    end

    error_message = nil
    already_member = false

    begin
      SpaceMembership.transaction do
        # Lock the space row to prevent concurrent capacity checks
        space.reload.lock!

        if space.deleted_at.present?
          error_message = :not_found
          raise ActiveRecord::Rollback
        end

        current_member_count = SpaceMembership.where(space_id: space.id).count
        max_allowed = space.max_members_allowed
        if current_member_count >= max_allowed
          error_message = "This space has reached its maximum capacity (#{max_allowed} members)."
          raise ActiveRecord::Rollback
        end

        existing = SpaceMembership.where(user_id: invitee.id, space_id: space.id).first
        if existing
          already_member = true
          raise ActiveRecord::Rollback
        end

        SpaceMembership.create!(user: invitee, space: space, role: "member")
      end
    rescue ActiveRecord::RecordInvalid => e
      render json: { errors: [ e.record.errors.full_messages.presence || e.message ].flatten }, status: :unprocessable_content
      return
    rescue ActiveRecord::RecordNotUnique
      already_member = true
    end

    if error_message.present?
      if error_message == :not_found
        render json: { error: "Space not found" }, status: :not_found
      else
        render json: { error: error_message }, status: :unprocessable_content
      end
      return
    end

    if already_member
      render json: { message: "User is already a member of this space." }
      return
    end

    begin
      send_invite_email(invitee.email, space.name)
    rescue => e
      Rails.logger.error("Failed to send invite email: #{e.message}")
    end

    render json: { success: true }
  end

  # List all members of a space visible to the current user (must be a member of that space)
  def members
    membership = SpaceMembership.includes(:space).find_by(space_id: params[:id], user_id: current_user.id)
    unless membership && membership.space.deleted_at.nil?
      render json: { error: "Space not found" }, status: :not_found
      return
    end

    memberships = SpaceMembership.joins(:user).includes(:user).where(space_id: membership.space_id).order("users.first_name ASC, users.last_name ASC")

    render json: {
      members: memberships.map { |m|
        {
          id: m.user.id,
          email: m.user.email,
          firstName: m.user.first_name,
          lastName: m.user.last_name,
          role: m.role
        }
      }
    }
  end

  # Soft-delete a space. Only the owner (creator) can delete.
  def destroy
    space = Space.active.where(id: params[:id], created_by_id: current_user.id).first
    unless space
      render json: { error: "Space not found" }, status: :not_found
      return
    end

    space.soft_delete!(deleted_by: current_user)

    render json: { success: true, deletedAt: space.deleted_at, purgeAfterAt: space.purge_after_at }
  rescue ActiveRecord::RecordInvalid => e
    render json: { errors: [ e.record.errors.full_messages.presence || e.message ].flatten }, status: :unprocessable_content
  end

  # Bulk soft-delete spaces. Only deletes spaces owned by the current user.
  def bulk_delete
    ids = params[:ids]
    ids = ids.is_a?(Array) ? ids.map(&:to_i).uniq : []
    if ids.empty?
      render json: { error: "No ids provided" }, status: :unprocessable_content
      return
    end

    # Limit to avoid excessive payloads
    ids = ids.first(50)

    owned_spaces = Space.active.where(id: ids, created_by_id: current_user.id)
    deleted_ids = []
    Space.transaction do
      owned_spaces.each do |space|
        space.soft_delete!(deleted_by: current_user)
        deleted_ids << space.id
      end
    end

    skipped_ids = ids - deleted_ids

    render json: { deleted: deleted_ids, skipped: skipped_ids }
  rescue ActiveRecord::RecordInvalid => e
    render json: { errors: [ e.record.errors.full_messages.presence || e.message ].flatten }, status: :unprocessable_content
  end

  # Recover a previously soft-deleted space (owner only)
  def recover
    space = Space.recently_deleted.where(id: params[:id], created_by_id: current_user.id).first
    unless space
      render json: { error: "Space not found" }, status: :not_found
      return
    end

    Space.transaction do
      space.reload.lock!
      unless space.deleted_at.present?
        render json: { error: "Space not found" }, status: :not_found
        raise ActiveRecord::Rollback
      end
      space.recover!
    end

    render json: { success: true }
  rescue ActiveRecord::RecordNotFound
    render json: { error: "Space not found" }, status: :not_found
  rescue ActiveRecord::RecordInvalid => e
    render json: { errors: [ e.record.errors.full_messages.presence || e.message ].flatten }, status: :unprocessable_content
  end

  # Permanently delete a previously deleted space (owner only)
  def purge
    space = Space.recently_deleted.where(id: params[:id], created_by_id: current_user.id).first
    unless space
      render json: { error: "Space not found" }, status: :not_found
      return
    end

    Space.transaction do
      space.reload.lock!
      # Ensure still deleted after locking
      unless space.deleted_at.present?
        render json: { error: "Space not found" }, status: :not_found
        raise ActiveRecord::Rollback
      end
      space.destroy!
    end

    head :no_content
  rescue ActiveRecord::RecordNotFound
    render json: { error: "Space not found" }, status: :not_found
  end

  # List recently deleted spaces owned by the current user, ordered by deleted_at desc
  def recently_deleted
    limit = [ [ params[:limit].to_i, 0 ].max, 50 ].min rescue 20
    limit = 20 if limit.zero?

    scoped = Space.where(created_by_id: current_user.id).recently_deleted

    order_sql = "spaces.deleted_at DESC NULLS LAST, spaces.id ASC"

    if (raw_cursor = params[:cursor]).present?
      cursor = decode_recently_deleted_cursor(raw_cursor)
      scoped = apply_recently_deleted_cursor(scoped, cursor) if recently_deleted_cursor_valid?(cursor)
    end

    records = scoped.order(order_sql).limit(limit + 1)

    has_more = records.length > limit
    records = records.first(limit)

    last_cursor = records.last ? encode_recently_deleted_cursor(records.last) : nil

    render json: {
      spaces: records.map { |s| serialize_deleted_space(s) },
      lastCursor: last_cursor,
      hasMore: has_more
    }
  end

  # Bulk recover soft-deleted spaces. Only spaces owned by current user are recovered.
  def bulk_recover
    ids = params[:ids]
    ids = ids.is_a?(Array) ? ids.map(&:to_i).uniq : []
    if ids.empty?
      render json: { error: "No ids provided" }, status: :unprocessable_content
      return
    end

    ids = ids.first(50)

    owned_spaces = Space.recently_deleted.where(id: ids, created_by_id: current_user.id)
    recovered_ids = []
    Space.transaction do
      owned_spaces.each do |space|
        space.reload.lock!
        next unless space.deleted_at.present?
        space.recover!
        recovered_ids << space.id
      end
    end

    skipped_ids = ids - recovered_ids

    render json: { recovered: recovered_ids, skipped: skipped_ids }
  rescue ActiveRecord::RecordInvalid => e
    render json: { errors: [ e.record.errors.full_messages.presence || e.message ].flatten }, status: :unprocessable_content
  end

  # Bulk purge soft-deleted spaces. Only spaces owned by current user are purged.
  def bulk_purge
    ids = params[:ids]
    ids = ids.is_a?(Array) ? ids.map(&:to_i).uniq : []
    if ids.empty?
      render json: { error: "No ids provided" }, status: :unprocessable_content
      return
    end

    ids = ids.first(50)

    owned_spaces = Space.recently_deleted.where(id: ids, created_by_id: current_user.id)
    purged_ids = []
    Space.transaction do
      owned_spaces.each do |space|
        space.reload.lock!
        next unless space.deleted_at.present?
        space.destroy!
        purged_ids << space.id
      end
    end

    skipped_ids = ids - purged_ids

    render json: { purged: purged_ids, skipped: skipped_ids }
  end

  # Displaying single space details
  def show
    membership = SpaceMembership.includes(:space).find_by(space_id: params[:id], user_id: current_user.id)
    space = membership&.space
    unless space && space.deleted_at.nil?
      render json: { error: "Space not found" }, status: :not_found
      return
    end

    render json: { space: serialize_space(space) }
  end

  private

  def spaces_scope_for_filter(filter)
    case filter
    when "created"
      current_user.created_spaces
    when "invited"
      current_user.spaces.where.not(created_by_id: current_user.id)
    else
      current_user.spaces
    end
  end

  # MAX(transactions.created_at) for each space
  def last_transaction_expr_sql
    Transaction.where("transactions.space_id = spaces.id").select("MAX(transactions.created_at)").to_sql
  end

  # Last activity is the latest transaction timestamp or the space creation time when there are no transactions
  def last_activity_expr_sql
    "COALESCE((#{last_transaction_expr_sql}), spaces.created_at)"
  end

  def cursor_valid?(cursor)
    cursor.is_a?(Hash) && cursor.key?("name") && cursor.key?("created_by_id") && cursor.key?("id") && cursor.key?("last_transaction_at")
  end

  def apply_cursor(scope, cursor, last_tx_expr)
    last_tx_at = cursor["last_transaction_at"]
    name = cursor["name"]
    created_by_id = cursor["created_by_id"]
    id = cursor["id"]

    expr_sql = "(#{last_tx_expr})"

    if last_tx_at.present?
      predicate = ActiveRecord::Base.send(:sanitize_sql_array, [
        <<~SQL.squish,
          ((#{expr_sql}) < ?
            OR ((#{expr_sql}) = ? AND spaces.name > ?)
            OR ((#{expr_sql}) = ? AND spaces.name = ? AND spaces.created_by_id > ?)
            OR ((#{expr_sql}) = ? AND spaces.name = ? AND spaces.created_by_id = ? AND spaces.id > ?))
        SQL
        last_tx_at, last_tx_at, name, last_tx_at, name, created_by_id, last_tx_at, name, created_by_id, id
      ])
    else
      predicate = ActiveRecord::Base.send(:sanitize_sql_array, [
        <<~SQL.squish,
          ((#{expr_sql}) IS NULL AND (
            spaces.name > ?
            OR (spaces.name = ? AND spaces.created_by_id > ?)
            OR (spaces.name = ? AND spaces.created_by_id = ? AND spaces.id > ?)
          ))
        SQL
        name, name, created_by_id, name, created_by_id, id
      ])
    end

    scope.where(predicate)
  end

  def encode_cursor(space)
    payload = {
      last_transaction_at: space.attributes["last_transaction_at"],
      name: space.name,
      created_by_id: space.created_by_id,
      id: space.id
    }
    Base64.urlsafe_encode64(payload.to_json)
  end

  def decode_cursor(encoded)
    JSON.parse(Base64.urlsafe_decode64(encoded))
  rescue
    nil
  end

  def serialize_space(space)
    creator_full_name = [ space.created_by&.first_name, space.created_by&.last_name ].compact.join(" ")
    role = space.attributes["current_user_role"].presence || (space.created_by_id == current_user.id ? "admin" : nil)

    {
      id: space.id,
      name: space.name,
      createdAt: space.created_at,
      createdById: space.created_by_id,
      createdByName: creator_full_name,
      createdByAvatarUrl: space.created_by&.avatar_url,
      role: role,
      transactionsCount: space.transactions_count,
      lastTransactionAt: space.attributes["last_transaction_at"],
      colorHex: space.color_hex,
      description: space.description
    }
  end

  def serialize_deleted_space(space)
    {
      id: space.id,
      name: space.name,
      deletedAt: space.deleted_at,
      purgeAfterAt: space.purge_after_at
    }
  end

  def encode_recently_deleted_cursor(space)
    payload = {
      deleted_at: space.deleted_at,
      id: space.id
    }
    Base64.urlsafe_encode64(payload.to_json)
  end

  def decode_recently_deleted_cursor(encoded)
    JSON.parse(Base64.urlsafe_decode64(encoded))
  rescue
    nil
  end

  def recently_deleted_cursor_valid?(cursor)
    cursor.is_a?(Hash) && cursor.key?("deleted_at") && cursor.key?("id")
  end

  def apply_recently_deleted_cursor(scope, cursor)
    deleted_at = cursor["deleted_at"]
    id = cursor["id"]

    predicate = ActiveRecord::Base.send(:sanitize_sql_array, [
      <<~SQL.squish,
        (spaces.deleted_at < ? OR (spaces.deleted_at = ? AND spaces.id > ?))
      SQL
      deleted_at, deleted_at, id
    ])

    scope.where(predicate)
  end

  def send_invite_email(to_email, space_name)
    api_key = ENV["SENDGRID_API_KEY"]
    return if api_key.to_s.strip.empty?

    uri = URI.parse("https://api.sendgrid.com/v3/mail/send")
    http = Net::HTTP.new(uri.host, uri.port)
    http.use_ssl = true

    from_email = ENV["INVITE_EMAIL_SENDER"].presence || "no-reply@example.com"

    payload = {
      personalizations: [
        {
          to: [ { email: to_email } ],
          subject: "You've been invited"
        }
      ],
      from: { email: from_email },
      content: [ { type: "text/plain", value: "You've been invited to join the space '#{space_name}'." } ]
    }

    request = Net::HTTP::Post.new(uri.request_uri)
    request["Authorization"] = "Bearer #{api_key}"
    request["Content-Type"] = "application/json"
    request.body = payload.to_json

    http.request(request)
  end
end
