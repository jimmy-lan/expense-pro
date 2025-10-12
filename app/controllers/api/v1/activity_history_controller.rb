class Api::V1::ActivityHistoryController < ApplicationController
  before_action :authenticate_user!
  before_action :set_space!
  before_action :ensure_space_membership!

  # GET /api/v1/spaces/:space_id/history/unseen
  def unseen
    membership = SpaceMembership.find_by(space_id: @space.id, user_id: current_user.id)
    last_seen = membership&.last_seen_activity_id.to_i

    # Pagination params
    raw_limit = params[:limit].to_i
    limit = [ [ raw_limit, 0 ].max, 50 ].min
    limit = 20 if limit.zero?
    cursor = params[:cursor].to_i if params[:cursor].present?

    scoped = ActivityHistory
      .for_space(@space.id)
      .includes(:actor_user)
      .where("id > ?", last_seen)

    # If a cursor is given, fetch items with id <= cursor; otherwise start from latest
    if cursor && cursor > 0
      scoped = scoped.where("id <= ?", cursor)
    end

    # Order by most recent first, fetch one extra to determine hasMore
    records = scoped.order(id: :desc).limit(limit + 1)

    has_more = records.length > limit
    records = records.first(limit)
    last_cursor = records.last&.id

    render json: {
      items: records.map { |a| serialize_event(a) },
      hasMore: has_more,
      lastCursor: last_cursor
    }
  end

  # GET /api/v1/spaces/:space_id/history/has_unseen
  # Returns whether the current user has any unseen activity in the space.
  def has_unseen
    membership = SpaceMembership.find_by(space_id: @space.id, user_id: current_user.id)
    unless membership
      render json: { error: "Space not found" }, status: :not_found
      return
    end

    last_seen = membership.last_seen_activity_id.to_i
    latest = Space.where(id: @space.id).pick(:latest_activity_id).to_i

    render json: { hasUnseen: latest > last_seen }
  end

  # POST /api/v1/spaces/:space_id/history/mark_seen
  # Marks the current user's last seen activity to the space's latest activity.
  def mark_seen
    membership = SpaceMembership.find_by(space_id: @space.id, user_id: current_user.id)
    unless membership
      render json: { error: "Space not found" }, status: :not_found
      return
    end

    latest = Space.where(id: @space.id).pick(:latest_activity_id).to_i

    SpaceMembership.where(id: membership.id).update_all([
      "last_seen_activity_id = GREATEST(last_seen_activity_id, ?)", latest
    ])
    membership.reload

    render json: {
      lastSeenActivityId: membership.last_seen_activity_id.to_i
    }
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
      render json: { error: "Space not found" }, status: :not_found
    end
  end

  def serialize_event(a)
    {
      id: a.id,
      verb: a.verb,
      createdAt: a.created_at,
      actor: a.actor_user_id ? {
        id: a.actor_user_id,
        firstName: a.actor_user&.first_name,
        lastName: a.actor_user&.last_name,
        avatarUrl: a.actor_user&.avatar_url
      } : nil,
      subject: {
        type: a.subject_type&.to_s,
        id: a.subject_id
      },
      metadata: a.metadata || {}
    }
  end
end
