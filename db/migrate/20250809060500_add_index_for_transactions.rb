class AddIndexForTransactions < ActiveRecord::Migration[8.0]
  def change
    add_index :transactions, [ :space_id, :created_at ], name: "index_transactions_on_space_and_created_at"
    add_index :transactions, [ :space_id, :occurred_at, :id ], name: "index_transactions_on_space_and_occurred_at_and_id"
  end
end
