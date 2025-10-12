class SpaceMembership < ApplicationRecord
  belongs_to :user
  belongs_to :space

  enum :role, { member: "member", admin: "admin" }, validate: true

  validates :user_id, uniqueness: { scope: :space_id }
  validates :role, presence: true, inclusion: { in: roles.keys }

  after_create :initialize_last_seen_pointer

  private

  def initialize_last_seen_pointer
    # Initialize last_seen to current latest for the space to avoid showing historical items as unseen
    current_latest = space.latest_activity_id.to_i
    return if current_latest <= 0

    update_columns(last_seen_activity_id: current_latest)
  end
end
