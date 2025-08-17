class UpdateTransactionAmountCheckForNegatives < ActiveRecord::Migration[8.0]
  def up
    begin
      remove_check_constraint :transactions, name: "transactions_amount_decimal_string"
    rescue
      # ignore if constraint name differs in some environments
    end

    add_check_constraint :transactions,
      "amount ~ '^[-]?[0-9]+(\\.[0-9]{1,2})?$'",
      name: "transactions_amount_decimal_string"
  end

  def down
    begin
      remove_check_constraint :transactions, name: "transactions_amount_decimal_string"
    rescue
    end

    add_check_constraint :transactions,
      "amount ~ '^[0-9]+(\\.[0-9]{1,2})?$'",
      name: "transactions_amount_decimal_string"
  end
end
