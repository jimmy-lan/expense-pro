class Transaction < ApplicationRecord
  belongs_to :space, counter_cache: true
  belongs_to :creator, class_name: "User"

  DECIMAL_STRING_REGEX = /\A-?\d+(?:\.\d{1,2})?\z/

  attr_accessor :amount

  validates :title, presence: true, length: { maximum: 100 }
  validates :description, length: { maximum: 500 }, allow_nil: true
  validates :occurred_at, presence: true
  validates :amount_cents, presence: true
  validate :validate_amount_format_if_present

  after_create :apply_contribution_after_create
  after_destroy :revert_contribution_after_destroy

  before_validation :derive_amount_cents

  private

  def validate_amount_format_if_present
    return if amount.nil?
    unless amount.is_a?(String) && amount.match?(DECIMAL_STRING_REGEX)
      errors.add(:amount, "is not a valid decimal with up to 2 decimals")
    end
  end

  def derive_amount_cents
    return if amount.nil? || amount.to_s.strip.empty?
    self.amount_cents = (BigDecimal(amount) * 100).to_i
  rescue ArgumentError
  end

  def apply_contribution_after_create
    spend_cents_delta = 0
    credit_cents_delta = 0
    full_cover_cents_delta = 0

    if full_cover
      full_cover_cents_delta = amount_cents.abs
    else
      if amount_cents >= 0
        credit_cents_delta = amount_cents
      else
        spend_cents_delta = amount_cents.abs
      end
    end

    SpaceMemberContribution.apply_delta!(
      space_id: space_id,
      user_id: creator_id,
      spend_cents: spend_cents_delta,
      credit_cents: credit_cents_delta,
      full_cover_cents: full_cover_cents_delta,
      transactions_count: 1
    )

    # Update memoized space totals
    apply_space_totals!(spend_cents_delta: spend_cents_delta, credit_cents_delta: credit_cents_delta)
  end

  def revert_contribution_after_destroy
    spend_cents_delta = 0
    credit_cents_delta = 0
    full_cover_cents_delta = 0

    if full_cover
      full_cover_cents_delta = -amount_cents.abs
    else
      if amount_cents >= 0
        credit_cents_delta = -amount_cents
      else
        spend_cents_delta = -amount_cents.abs
      end
    end

    SpaceMemberContribution.apply_delta!(
      space_id: space_id,
      user_id: creator_id,
      spend_cents: spend_cents_delta,
      credit_cents: credit_cents_delta,
      full_cover_cents: full_cover_cents_delta,
      transactions_count: -1
    )

    apply_space_totals!(spend_cents_delta: spend_cents_delta, credit_cents_delta: credit_cents_delta)
  end

  def apply_space_totals!(spend_cents_delta:, credit_cents_delta:)
    Space.where(id: space_id).update_all([
      "total_spend_cents = COALESCE(total_spend_cents, 0) + ?, total_credit_cents = COALESCE(total_credit_cents, 0) + ?",
      spend_cents_delta, credit_cents_delta
    ])
  end
end
