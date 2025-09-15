class AddAmountCentsToTransactions < ActiveRecord::Migration[8.0]
  def up
    add_column :transactions, :amount_cents, :bigint unless column_exists?(:transactions, :amount_cents)

    # Backfill amount_cents from existing amount string. amount has up to 2 decimals, so *100 is exact.
    execute <<~SQL.squish
      UPDATE transactions
      SET amount_cents = CAST((amount::numeric * 100) AS bigint)
      WHERE amount_cents IS NULL AND amount IS NOT NULL AND amount <> ''
    SQL

    # Guard: if any rows remain NULL, fail safely to avoid incorrect defaults
    invalid_count = ActiveRecord::Base.connection.select_value("SELECT COUNT(1) FROM transactions WHERE amount_cents IS NULL").to_i
    if invalid_count > 0
      raise ActiveRecord::MigrationError, "Backfill failed: #{invalid_count} transactions have invalid or blank amount values"
    end

    change_column_null :transactions, :amount_cents, false
  end

  def down
    remove_column :transactions, :amount_cents if column_exists?(:transactions, :amount_cents)
  end
end
