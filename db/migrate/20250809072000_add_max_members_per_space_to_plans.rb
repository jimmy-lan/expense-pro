class AddMaxMembersPerSpaceToPlans < ActiveRecord::Migration[8.0]
  def up
    add_column :plans, :max_members_per_space, :integer

    # Backfill sensible values based on known plan keys
    execute <<~SQL.squish
      UPDATE plans SET max_members_per_space = 5 WHERE key = 'regular' AND max_members_per_space IS NULL;
    SQL
    execute <<~SQL.squish
      UPDATE plans SET max_members_per_space = 12 WHERE key = 'premium' AND max_members_per_space IS NULL;
    SQL

    # Ensure no nulls remain; if any other plans exist without a value, set a conservative minimum of 1
    execute <<~SQL.squish
      UPDATE plans SET max_members_per_space = 1 WHERE max_members_per_space IS NULL;
    SQL

    change_column_null :plans, :max_members_per_space, false
    add_check_constraint :plans, "max_members_per_space > 0", name: "plans_max_members_positive"
  end

  def down
    remove_check_constraint :plans, name: "plans_max_members_positive"
    remove_column :plans, :max_members_per_space
  end
end
