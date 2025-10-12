class AddLatestActivityIdToSpaces < ActiveRecord::Migration[8.0]
  def change
    add_column :spaces, :latest_activity_id, :bigint, null: false, default: 0
  end
end
