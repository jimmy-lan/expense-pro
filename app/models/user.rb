class User < ApplicationRecord
  has_secure_password validations: true

  belongs_to :plan

  has_many :created_spaces, class_name: "Space", foreign_key: "created_by_id", dependent: :nullify
  has_many :space_memberships, dependent: :destroy
  has_many :spaces, through: :space_memberships
  has_many :transactions, foreign_key: "creator_id", dependent: :nullify

  before_validation :normalize_email
  before_validation :assign_default_plan, on: :create

  validates :email, presence: true, length: { maximum: 320 }, format: { with: /\A[^\s@]+@[^\s@]+\.[^\s@]+\z/ }
  validates :email, uniqueness: { case_sensitive: false }
  validates :first_name, presence: true
  validates :last_name, presence: true
  validates :plan, presence: true

  private

  def normalize_email
    self.email = email.to_s.strip.downcase
  end

  def assign_default_plan
    self.plan ||= Plan.find_by(key: "regular")
  end
end
