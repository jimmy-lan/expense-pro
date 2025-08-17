class CreateTransactions < ActiveRecord::Migration[8.0]
  def change
    create_table :transactions do |t|
      t.string :title, null: false, limit: 100
      t.text :description, limit: 500
      t.string :amount, null: false
      t.datetime :occurred_at, null: false
      t.references :space, null: false, foreign_key: true
      t.references :creator, null: false, foreign_key: { to_table: :users }

      t.timestamps
    end

    add_check_constraint :transactions, "amount ~ '^[0-9]+(\\.[0-9]{1,2})?$'", name: "transactions_amount_decimal_string"
    add_index :transactions, [ :space_id, :occurred_at ], name: "index_transactions_on_space_and_occurred_at"
    add_index :transactions, [ :space_id, :occurred_at, :created_at, :id ], name: "index_transactions_on_space_and_occurred_at_and_created_at_and_id"
  end
end
