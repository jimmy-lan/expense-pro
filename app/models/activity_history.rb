class ActivityHistory < ApplicationRecord
  self.table_name = "activity_history"

  belongs_to :space
  belongs_to :actor_user, class_name: "User", optional: true

  VERBS = %w[created deleted updated].freeze

  validates :verb, presence: true, inclusion: { in: VERBS }
  validates :subject_id, numericality: { only_integer: true }, allow_nil: true
  validates :subject_type, length: { maximum: 30 }, allow_nil: true

  scope :for_space, ->(space_id) { where(space_id: space_id) }

  # Record an activity history and apply pointer updates.
  # Bump actor's last_seen only if they were fully caught up at the moment of action.
  def self.record!(space:, actor:, verb:, subject: nil, subject_type: nil, metadata: {})
    raise ArgumentError, "invalid verb" unless VERBS.include?(verb)

    subject_type ||= subject&.class&.name&.underscore
    subject_id = subject&.id

    event = nil
    transaction do
      event = create!(
        space_id: space.id,
        actor_user_id: actor&.id,
        verb: verb,
        subject_type: subject_type,
        subject_id: subject_id,
        metadata: (metadata || {})
      )

      # Update latest pointer on space
      Space.where(id: space.id).where("COALESCE(latest_activity_id, 0) < ?", event.id)
        .update_all([ "latest_activity_id = ?", event.id ])

      # Conditionally bump actor's last_seen if they were caught up
      if actor
        member = SpaceMembership.lock.where(space_id: space.id, user_id: actor.id).first
        if member
          current_seen = member.last_seen_activity_id.to_i

          # Check for gap to avoid race condition
          gap_exists = ActivityHistory
            .where(space_id: space.id)
            .where("id > ? AND id < ?", current_seen, event.id)
            .exists?

          unless gap_exists
            member.update_columns(last_seen_activity_id: [ current_seen, event.id ].max)
          end
        end
      end
    end

    event
  end
end
