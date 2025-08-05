class CreatePlans < ActiveRecord::Migration[8.0]
  def change
    create_table :plans do |t|
      t.string :key, null: false
      t.string :name, null: false
      t.integer :max_spaces, null: false, default: 20
      t.integer :max_transactions_per_space, null: false, default: 500
      t.integer :expires_after_days

      t.timestamps
    end

    add_index :plans, :key, unique: true
    add_check_constraint :plans, "max_spaces > 0", name: "plans_max_spaces_positive"
    add_check_constraint :plans, "max_transactions_per_space > 0", name: "plans_max_tx_positive"

    reversible do |dir|
      dir.up do
        say_with_time "Seeding default plans" do
          Plan.reset_column_information
          Plan.find_or_create_by!(key: "regular") do |p|
            p.name = "Regular"
            p.max_spaces = 20
            p.max_transactions_per_space = 500
            p.expires_after_days = 60
          end

          Plan.find_or_create_by!(key: "premium") do |p|
            p.name = "Premium"
            p.max_spaces = 50
            p.max_transactions_per_space = 10_000
            p.expires_after_days = nil
          end
        end
      end
    end
  end
end 