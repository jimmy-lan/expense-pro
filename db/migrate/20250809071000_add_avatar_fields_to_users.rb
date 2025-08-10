class AddAvatarFieldsToUsers < ActiveRecord::Migration[8.0]
  def up
    add_column :users, :avatar_bg_hex, :string, limit: 6
    add_column :users, :avatar_fg, :string, limit: 5 # 'white' or 'black'

    say_with_time "Backfilling avatars for users" do
      User.reset_column_information
      User.find_each do |user|
        next if user.avatar_bg_hex.present? && user.avatar_fg.present?

        bg = random_hex_color
        fg = contrast_color_for_hex(bg)
        user.update_columns(avatar_bg_hex: bg, avatar_fg: fg)
      end
    end
  end

  def down
    remove_column :users, :avatar_fg
    remove_column :users, :avatar_bg_hex
  end

  private

  # Generate a random 6-char hex string without '#'
  def random_hex_color
    "%06x" % (rand * 0xffffff)
  end

  # Choose black or white for contrast against the given hex
  def contrast_color_for_hex(hex)
    r = hex[0..1].to_i(16)
    g = hex[2..3].to_i(16)
    b = hex[4..5].to_i(16)
    # Calculate relative luminance and choose foreground
    # Per W3C formula approximate: (299*R + 587*G + 114*B)/1000
    luminance = (299 * r + 587 * g + 114 * b) / 1000.0
    luminance > 128 ? 'black' : 'white'
  end
end
