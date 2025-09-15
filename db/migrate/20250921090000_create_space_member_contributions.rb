class CreateSpaceMemberContributions < ActiveRecord::Migration[8.0]
  def change
    create_table :space_member_contributions do |t|
      t.bigint :space_id, null: false
      t.bigint :user_id, null: false
      t.bigint :spend_cents, null: false, default: 0
      t.bigint :credit_cents, null: false, default: 0
      t.bigint :full_cover_cents, null: false, default: 0
      t.integer :transactions_count, null: false, default: 0
      t.timestamps
    end

    add_foreign_key :space_member_contributions, :spaces, column: :space_id
    add_foreign_key :space_member_contributions, :users, column: :user_id
    add_index :space_member_contributions, [ :space_id, :user_id ], unique: true, name: "index_contributions_on_space_and_user"
    add_index :space_member_contributions, :space_id
  end
end
