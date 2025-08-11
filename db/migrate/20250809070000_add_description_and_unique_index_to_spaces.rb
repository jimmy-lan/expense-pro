class AddDescriptionAndUniqueIndexToSpaces < ActiveRecord::Migration[8.0]
  disable_ddl_transaction!

  def up
    add_column :spaces, :description, :string, limit: 200

    add_index :spaces,
              "LOWER(name), created_by_id",
              name: "index_spaces_on_lower_name_and_created_by_id",
              unique: true,
              algorithm: :concurrently
  end

  def down
    remove_index :spaces, name: "index_spaces_on_lower_name_and_created_by_id"
    remove_column :spaces, :description
  end
end
