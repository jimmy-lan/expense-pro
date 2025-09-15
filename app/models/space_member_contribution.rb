class SpaceMemberContribution < ApplicationRecord
  belongs_to :space
  belongs_to :user

  validates :space_id, presence: true
  validates :user_id, presence: true
  validates :spend_cents, :credit_cents, :full_cover_cents, numericality: { only_integer: true }
  validates :transactions_count, numericality: { only_integer: true }

  # Apply transaction amount delta changes atomically for a given space/user pair.
  def self.apply_delta!(space_id:, user_id:, spend_cents: 0, credit_cents: 0, full_cover_cents: 0, transactions_count: 0)
    raise ArgumentError, "space_id required" unless space_id.present?
    raise ArgumentError, "user_id required" unless user_id.present?

    attempts = 0
    begin
      transaction do
        record = find_or_create_by!(space_id: space_id, user_id: user_id)
        record.with_lock do
          record.update!(
            spend_cents: record.spend_cents + spend_cents,
            credit_cents: record.credit_cents + credit_cents,
            full_cover_cents: record.full_cover_cents + full_cover_cents,
            transactions_count: record.transactions_count + transactions_count
          )
        end
        record
      end
    rescue ActiveRecord::RecordNotUnique
      attempts += 1
      retry if attempts < 3
      raise
    end
  end
end
