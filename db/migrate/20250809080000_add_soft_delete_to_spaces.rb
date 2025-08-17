class AddSoftDeleteToSpaces < ActiveRecord::Migration[8.0]
  def change
    add_column :spaces, :deleted_at, :datetime
    add_column :spaces, :purge_after_at, :datetime

    add_index :spaces, :deleted_at
    add_index :spaces, :purge_after_at
  end
end
