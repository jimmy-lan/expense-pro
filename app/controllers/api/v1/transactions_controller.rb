class Api::V1::TransactionsController < ApplicationController
  before_action :authenticate_user!
  before_action :set_space!
  before_action :ensure_space_membership!

  def index
    limit = [ [ params[:limit].to_i, 0 ].max, 50 ].min rescue 20
    limit = 20 if limit.zero?

    scoped = @space.transactions.includes(:creator)

    order_sql = <<~SQL.squish
      transactions.occurred_at DESC, transactions.created_at DESC, transactions.id ASC
    SQL

    if (raw_cursor = params[:cursor]).present?
      cursor = decode_cursor(raw_cursor)
      scoped = apply_cursor(scoped, cursor) if cursor_valid?(cursor)
    end

    records = scoped.order(order_sql).limit(limit + 1)

    has_more = records.length > limit
    records = records.first(limit)

    last_cursor = records.last ? encode_cursor(records.last) : nil

    render json: {
      transactions: records.map { |t| serialize_transaction(t) },
      lastCursor: last_cursor,
      hasMore: has_more
    }
  end

  # GET /api/v1/spaces/:space_id/transactions/:id
  def show
    tx = @space.transactions.includes(:creator).find_by(id: params[:id])
    unless tx
      render json: { error: "Transaction not found" }, status: :not_found
      return
    end

    render json: { transaction: serialize_transaction(tx) }
  end

  def create
    title = params[:title].to_s.strip
    description = params[:description].to_s.strip.presence
    amount = params[:amount].to_s.strip
    occurred_at = begin
      Time.zone.parse(params[:occurred_at].to_s)
    rescue
      nil
    end
    full_cover = ActiveModel::Type::Boolean.new.cast(params[:full_cover])

    tx = @space.transactions.build(
      title: title,
      description: description,
      amount: amount,
      occurred_at: occurred_at,
      creator: current_user,
      full_cover: full_cover
    )

    if tx.save
      render json: { transaction: serialize_transaction(tx) }, status: :created
    else
      render json: { errors: tx.errors.full_messages.presence || [ "Validation failed" ] }, status: :unprocessable_content
    end
  end

  # DELETE /api/v1/spaces/:space_id/transactions/:id
  def destroy
    tx = @space.transactions.find_by(id: params[:id])
    unless tx
      render json: { error: "Transaction not found" }, status: :not_found
      return
    end

    # Permission: creator can delete their own, space admin can delete any
    is_creator = tx.creator_id == current_user.id
    is_admin = SpaceMembership.where(space_id: @space.id, user_id: current_user.id, role: "admin").exists?
    unless is_creator || is_admin
      render json: { error: "You do not have permission to delete this transaction" }, status: :forbidden
      return
    end

    Transaction.transaction do
      tx.destroy!
    end

    render json: { deleted: true }
  rescue ActiveRecord::RecordInvalid => e
    render json: { errors: [ e.record.errors.full_messages.presence || e.message ].flatten }, status: :unprocessable_content
  end

  private

  def set_space!
    @space = Space.active.find_by(id: params[:space_id])
    unless @space
      render json: { error: "Space not found" }, status: :not_found
    end
  end

  def ensure_space_membership!
    return if performed?
    membership = SpaceMembership.find_by(space_id: @space.id, user_id: current_user.id)
    unless membership
      render json: { error: "You do not have access to this space" }, status: :forbidden
    end
  end

  def serialize_transaction(t)
    creator_full_name = [ t.creator&.first_name, t.creator&.last_name ].compact.join(" ")
    {
      id: t.id,
      title: t.title,
      description: t.description,
      amount: t.amount,
      occurredAt: t.occurred_at,
      createdAt: t.created_at,
      creator: {
        id: t.creator_id,
        name: creator_full_name,
        avatarUrl: t.creator&.avatar_url
      },
      fullCover: !!t.full_cover
    }
  end

  def cursor_valid?(cursor)
    cursor.is_a?(Hash) && cursor.key?("occurred_at") && cursor.key?("created_at") && cursor.key?("id")
  end

  def encode_cursor(t)
    payload = { occurred_at: t.occurred_at, created_at: t.created_at, id: t.id }
    Base64.urlsafe_encode64(payload.to_json)
  end

  def decode_cursor(encoded)
    JSON.parse(Base64.urlsafe_decode64(encoded))
  rescue
    nil
  end

  def apply_cursor(scope, cursor)
    occurred_at = cursor["occurred_at"]
    created_at = cursor["created_at"]
    id = cursor["id"]

    predicate = ActiveRecord::Base.send(:sanitize_sql_array, [
      <<~SQL.squish,
        (transactions.occurred_at < ?
          OR (transactions.occurred_at = ? AND transactions.created_at < ?)
          OR (transactions.occurred_at = ? AND transactions.created_at = ? AND transactions.id > ?))
      SQL
      occurred_at, occurred_at, created_at, occurred_at, created_at, id
    ])

    scope.where(predicate)
  end
end
