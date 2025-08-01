class SpaceMembership < ApplicationRecord
  belongs_to :user
  belongs_to :space

  enum :role, { member: "member", admin: "admin" }, validate: true

  validates :user_id, uniqueness: { scope: :space_id }
  validates :role, presence: true, inclusion: { in: roles.keys }
end
