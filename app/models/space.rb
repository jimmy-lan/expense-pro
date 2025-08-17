class Space < ApplicationRecord
  belongs_to :created_by, class_name: "User", counter_cache: :created_spaces_count

  has_many :space_memberships, dependent: :destroy
  has_many :members, through: :space_memberships, source: :user
  has_many :transactions, dependent: :destroy

  validates :name, presence: true
  validates :name, uniqueness: { scope: :created_by_id, case_sensitive: false }
  validates :description, length: { maximum: 200 }, allow_nil: true

  scope :active, -> { where(deleted_at: nil) }
  scope :recently_deleted, -> { where.not(deleted_at: nil) }

  # Returns the maximum number of members allowed in this space, including the owner.
  def max_members_allowed
    created_by&.plan&.max_members_per_space || 1
  end

  # Soft-delete this space and set a purge deadline based on the owner's plan
  # Returns true if the update succeeds
  def soft_delete!(deleted_by: nil)
    return true if deleted_at.present?

    retention = (created_by&.plan&.deleted_space_retention_duration || 4.hours)
    now = Time.current
    update!(deleted_at: now, purge_after_at: now + retention)
  end
end
