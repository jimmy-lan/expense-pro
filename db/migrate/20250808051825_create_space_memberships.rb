class CreateSpaceMemberships < ActiveRecord::Migration[8.0]
  def change
    create_table :space_memberships do |t|
      t.references :user, null: false, foreign_key: true
      t.references :space, null: false, foreign_key: true
      t.string :role, null: false, default: "member"

      t.timestamps
    end

    add_check_constraint :space_memberships, "role IN ('member','admin')", name: "space_memberships_role_allowed"
    add_index :space_memberships, [ :user_id, :space_id ], unique: true, name: "index_space_memberships_on_user_and_space"
    add_index :space_memberships, [ :space_id, :role ], name: "index_space_memberships_on_space_and_role"
  end
end
