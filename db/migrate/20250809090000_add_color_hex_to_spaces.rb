class AddColorHexToSpaces < ActiveRecord::Migration[8.0]
  def change
    add_column :spaces, :color_hex, :string, limit: 6
  end
end
