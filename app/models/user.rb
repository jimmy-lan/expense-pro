class User < ApplicationRecord
  has_secure_password validations: true

  belongs_to :plan

  has_many :created_spaces, class_name: "Space", foreign_key: "created_by_id", dependent: :nullify
  has_many :space_memberships, dependent: :destroy
  has_many :spaces, through: :space_memberships
  has_many :transactions, foreign_key: "creator_id", dependent: :nullify

  before_validation :normalize_email
  before_validation :assign_default_plan, on: :create
  before_create :assign_avatar

  validates :email, presence: true, length: { maximum: 320 }, format: { with: /\A[^\s@]+@[^\s@]+\.[^\s@]+\z/ }
  validates :email, uniqueness: { case_sensitive: false }
  validates :first_name, presence: true
  validates :last_name, presence: true
  validates :plan, presence: true

  def avatar_url
    bg = (avatar_bg_hex.presence || random_hex_color)
    fg = (avatar_fg.presence || contrast_color_for_hex(bg))
    initial = (first_name.to_s[0] || last_name.to_s[0] || email.to_s[0] || "U").upcase
    # Using Dicebear initials style via API
    # example: https://api.dicebear.com/9.x/initials/svg?seed=A&backgroundColor=ff00aa&fontColor=ffffff
    fg_hex = (fg == "white" ? "ffffff" : "000000")
    "https://api.dicebear.com/9.x/initials/svg?seed=#{CGI.escape(initial)}&backgroundColor=#{bg}&fontColor=#{fg_hex}"
  end

  private

  def normalize_email
    self.email = email.to_s.strip.downcase
  end

  def assign_default_plan
    self.plan ||= Plan.find_by(key: "regular")
  end

  def assign_avatar
    self.avatar_bg_hex ||= random_hex_color
    self.avatar_fg ||= contrast_color_for_hex(self.avatar_bg_hex)
  end

  def random_hex_color
    "%06x" % (SecureRandom.random_number(0xffffff))
  end

  def contrast_color_for_hex(hex)
    r = hex.to_s[0..1].to_i(16)
    g = hex.to_s[2..3].to_i(16)
    b = hex.to_s[4..5].to_i(16)
    luminance = (299 * r + 587 * g + 114 * b) / 1000.0
    luminance > 128 ? "black" : "white"
  end
end
