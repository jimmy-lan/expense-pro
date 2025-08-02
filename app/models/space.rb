class Space < ApplicationRecord
  belongs_to :created_by, class_name: "User"

  has_many :space_memberships, dependent: :destroy
  has_many :members, through: :space_memberships, source: :user
  has_many :transactions, dependent: :destroy

  validates :name, presence: true
end
