class Transaction < ApplicationRecord
  belongs_to :space, counter_cache: true
  belongs_to :creator, class_name: "User"

  DECIMAL_STRING_REGEX = /\A\d+(?:\.\d{1,2})?\z/

  validates :title, presence: true, length: { maximum: 100 }
  validates :description, length: { maximum: 500 }, allow_nil: true
  validates :amount, presence: true, format: { with: DECIMAL_STRING_REGEX }
  validates :occurred_at, presence: true
end
