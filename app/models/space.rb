class Space < ApplicationRecord
  belongs_to :created_by, class_name: "User", counter_cache: :created_spaces_count

  has_many :space_memberships, dependent: :destroy
  has_many :members, through: :space_memberships, source: :user
  has_many :transactions, dependent: :destroy

  validates :name, presence: true
  validates :name, uniqueness: { scope: :created_by_id, case_sensitive: false }
  validates :description, length: { maximum: 200 }, allow_nil: true

  # Returns the maximum number of members allowed in this space, including the owner.
  def max_members_allowed
    created_by&.plan&.max_members_per_space || 1
  end
end
