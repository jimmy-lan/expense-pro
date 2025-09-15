class RemoveAmountFromTransactions < ActiveRecord::Migration[8.0]
  def up
    # Remove check constraint if it exists
    begin
      remove_check_constraint :transactions, name: "transactions_amount_decimal_string"
    rescue
    end

    if column_exists?(:transactions, :amount)
      remove_column :transactions, :amount
    end
  end

  def down
    # Recreate amount column as nullable first to allow backfill
    add_column :transactions, :amount, :string unless column_exists?(:transactions, :amount)

    # Backfill amount from amount_cents with two decimals
    execute <<~SQL.squish
      UPDATE transactions
      SET amount = to_char((amount_cents::numeric / 100.0), 'FM999999999999999999999990.00')
      WHERE amount IS NULL
    SQL

    # Guard: ensure no NULL amounts remain
    remaining = ActiveRecord::Base.connection.select_value("SELECT COUNT(1) FROM transactions WHERE amount IS NULL").to_i
    if remaining > 0
      raise ActiveRecord::MigrationError, "Rollback failed: #{remaining} transactions have NULL amount after backfill"
    end

    change_column_null :transactions, :amount, false

    add_check_constraint :transactions,
      "amount ~ '^[-]?[0-9]+(\\.[0-9]{1,2})?$'",
      name: "transactions_amount_decimal_string"
  end
end
