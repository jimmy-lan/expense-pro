class Api::V1::SpacesController < ApplicationController
  before_action :authenticate_user!

  def index
    filter = params[:filter].to_s.presence || "all"
    limit = [ [ params[:limit].to_i, 0 ].max, 50 ].min rescue 20
    limit = 20 if limit.zero?

    base_scope = spaces_scope_for_filter(filter)

    last_tx_expr = last_transaction_expr_sql

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
      render json: { errors: ["Name has already been taken"] }, status: :unprocessable_entity
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
end
