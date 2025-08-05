class AddPlanToUsersAndCounters < ActiveRecord::Migration[8.0]
  def up
    add_reference :users, :plan, null: true, foreign_key: true
    add_column :users, :created_spaces_count, :integer, null: false, default: 0
    add_column :spaces, :transactions_count, :integer, null: false, default: 0

    # Backfill plan for existing users to regular
    regular_plan_id = execute("SELECT id FROM plans WHERE key = 'regular' LIMIT 1").values.dig(0, 0)
    if regular_plan_id
      execute <<~SQL
        UPDATE users SET plan_id = #{regular_plan_id} WHERE plan_id IS NULL;
      SQL
    end

    # Backfill user.created_spaces_count
    execute <<~SQL
      UPDATE users
      SET created_spaces_count = sub.count
      FROM (
        SELECT created_by_id AS user_id, COUNT(*) AS count
        FROM spaces
        GROUP BY created_by_id
      ) AS sub
      WHERE users.id = sub.user_id;
    SQL

    # Backfill spaces.transactions_count
    execute <<~SQL
      UPDATE spaces
      SET transactions_count = sub.count
      FROM (
        SELECT space_id, COUNT(*) AS count
        FROM transactions
        GROUP BY space_id
      ) AS sub
      WHERE spaces.id = sub.space_id;
    SQL

    change_column_null :users, :plan_id, false
  end

  def down
    change_column_null :users, :plan_id, true
    remove_column :spaces, :transactions_count
    remove_column :users, :created_spaces_count
    remove_reference :users, :plan, foreign_key: true
  end
end
