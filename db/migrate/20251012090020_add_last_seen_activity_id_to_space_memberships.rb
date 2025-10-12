class AddLastSeenActivityIdToSpaceMemberships < ActiveRecord::Migration[8.0]
  def change
    add_column :space_memberships, :last_seen_activity_id, :bigint, null: false, default: 0
  end
end
