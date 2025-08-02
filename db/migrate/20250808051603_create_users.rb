class CreateUsers < ActiveRecord::Migration[8.0]
  def change
    create_table :users do |t|
      t.string :email, null: false
      t.string :first_name, null: false
      t.string :last_name, null: false
      t.string :password_digest

      t.timestamps
    end

    # Case-insensitive unique email
    add_index :users, "lower(email)", unique: true, name: "index_users_on_lower_email"
  end
end
