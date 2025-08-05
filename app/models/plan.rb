class Plan < ApplicationRecord
  enum :key, { regular: "regular", premium: "premium" }, validate: true

  validates :key, presence: true, inclusion: { in: keys.keys }, uniqueness: true
  validates :name, presence: true
  validates :max_spaces, presence: true, numericality: { only_integer: true, greater_than: 0 }
  validates :max_transactions_per_space, presence: true, numericality: { only_integer: true, greater_than: 0 }
  validates :expires_after_days, numericality: { only_integer: true, greater_than: 0 }, allow_nil: true
end 