class Plan < ApplicationRecord
  enum :key, { regular: "regular", premium: "premium" }, validate: true

  validates :key, presence: true, inclusion: { in: keys.keys }, uniqueness: true
  validates :name, presence: true
  validates :max_spaces, presence: true, numericality: { only_integer: true, greater_than: 0 }
  validates :max_transactions_per_space, presence: true, numericality: { only_integer: true, greater_than: 0 }
  validates :expires_after_days, numericality: { only_integer: true, greater_than: 0 }, allow_nil: true
  validates :max_members_per_space, presence: true, numericality: { only_integer: true, greater_than: 0 }
  validates :deleted_space_retention_hours, presence: true, numericality: { only_integer: true, greater_than_or_equal_to: 0 }

  # Returns an ActiveSupport::Duration indicating how long to retain a space after deletion
  def deleted_space_retention_duration
    hours = (deleted_space_retention_hours.presence || 4).to_i
    hours.hours
  end
end
