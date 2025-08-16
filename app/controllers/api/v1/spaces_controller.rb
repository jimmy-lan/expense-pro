require "net/http"
require "uri"

class Api::V1::SpacesController < ApplicationController
  before_action :authenticate_user!

  def index
    filter = params[:filter].to_s.presence || "all"
    limit = [ [ params[:limit].to_i, 0 ].max, 50 ].min rescue 20
    limit = 20 if limit.zero?

    base_scope = spaces_scope_for_filter(filter)

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
    render json: {
      maxSpaces: plan.max_spaces,
      createdSpacesCount: current_user.created_spaces_count,
      canCreateMore: current_user.created_spaces_count < plan.max_spaces
    }
  end

  def create
    plan = current_user.plan
    if current_user.created_spaces_count >= plan.max_spaces
      render json: { error: "You have reached the maximum number of spaces for your plan." }, status: :unprocessable_entity
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
      render json: { errors: space.errors.full_messages.presence || [ e.record.errors.full_messages.presence || e.message ].flatten }, status: :unprocessable_entity
      return
    rescue ActiveRecord::RecordNotUnique
      render json: { errors: [ "Name has already been taken" ] }, status: :unprocessable_entity
      return
    end

    render json: {
      space: {
        id: space.id,
        name: space.name,
        description: space.description,
        createdAt: space.created_at
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
    admin_membership = SpaceMembership.includes(:space).where(space_id: params[:id], user_id: current_user.id, role: "admin").first
    unless admin_membership
      render json: { error: "Space not found" }, status: :not_found
      return
    end
    space = admin_membership.space

    invitee_email = params[:email].to_s.strip.downcase
    if invitee_email.blank?
      render json: { error: "Email is required" }, status: :unprocessable_entity
      return
    end

    invitee = User.where("LOWER(email) = ?", invitee_email).first
    unless invitee
      render json: { error: "The user to invite does not exist in the system." }, status: :unprocessable_entity
      return
    end

    if invitee.id == current_user.id
      render json: { error: "You cannot invite yourself." }, status: :unprocessable_entity
      return
    end

    error_message = nil
    already_member = false

    begin
      SpaceMembership.transaction do
        # Lock the space row to prevent concurrent capacity checks
        space.reload.lock!

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
      render json: { errors: [ e.record.errors.full_messages.presence || e.message ].flatten }, status: :unprocessable_entity
      return
    rescue ActiveRecord::RecordNotUnique
      already_member = true
    end

    if error_message.present?
      render json: { error: error_message }, status: :unprocessable_entity
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
    membership = SpaceMembership.where(space_id: params[:id], user_id: current_user.id).first
    unless membership
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

  # Remove a member from a space (admin only). Current user cannot remove themself.
  def remove_member
    admin_membership = SpaceMembership.where(space_id: params[:id], user_id: current_user.id, role: "admin").first
    unless admin_membership
      render json: { error: "Space not found" }, status: :not_found
      return
    end

    target_user_id = params[:user_id].to_i
    if target_user_id == current_user.id
      render json: { error: "You cannot remove yourself." }, status: :unprocessable_entity
      return
    end

    membership = SpaceMembership.where(space_id: admin_membership.space_id, user_id: target_user_id).first
    unless membership
      render json: { error: "Member not found" }, status: :not_found
      return
    end

    membership.destroy!
    render json: { success: true }
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
      createdByName: creator_full_name,
      role: role,
      transactionsCount: space.transactions_count,
      lastTransactionAt: space.attributes["last_transaction_at"]
    }
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
