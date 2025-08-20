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

  before_create :assign_color

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

    # Step 1: baseline time is now + retention
    baseline_time = now + retention

    # Step 2: round up to the next 3 AM in America/Vancouver, because that's when the purge job runs
    pacific_tz = ActiveSupport::TimeZone["America/Vancouver"]
    baseline_local = baseline_time.in_time_zone(pacific_tz)
    next_three_am_local = pacific_tz.local(baseline_local.year, baseline_local.month, baseline_local.day, 3)
    next_three_am_local += 1.day if next_three_am_local < baseline_local

    update!(deleted_at: now, purge_after_at: next_three_am_local.utc)
  end

  private

  # Assign a color hex to this space if not already set
  def assign_color
    self.color_hex ||= self.class.random_palette_hex
  end

  # Curated set of brand-like colors across hues (without #). Not guaranteed to be light.
  COLOR_HEX_PALETTE = %w[
    2563EB 7C3AED DB2777 EF4444 F59E0B 10B981 06B6D4 3B82F6 8B5CF6 14B8A6
    0EA5E9 F43F5E A3E635 84CC16 EAB308 22C55E 059669 D946EF 6366F1 0D9488
  ].freeze

  # Pick a random color from the palette
  def self.random_palette_hex
    COLOR_HEX_PALETTE[SecureRandom.random_number(COLOR_HEX_PALETTE.length)]
  end
end
