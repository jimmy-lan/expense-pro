class AddDeletedSpaceRetentionToPlans < ActiveRecord::Migration[8.0]
  def up
    add_column :plans, :deleted_space_retention_hours, :integer, null: false, default: 4
    add_check_constraint :plans, "deleted_space_retention_hours >= 0", name: "plans_deleted_space_retention_non_negative"

    # Backfill: set premium to 30 days (720 hours), regular to 4 hours
    execute <<~SQL
      UPDATE plans SET deleted_space_retention_hours = 720 WHERE key = 'premium';
    SQL
    execute <<~SQL
      UPDATE plans SET deleted_space_retention_hours = 4 WHERE key = 'regular';
    SQL
  end

  def down
    remove_check_constraint :plans, name: "plans_deleted_space_retention_non_negative"
    remove_column :plans, :deleted_space_retention_hours
  end
end
