class AddTotalsToSpaces < ActiveRecord::Migration[8.0]
  def up
    add_column :spaces, :total_spend_cents, :bigint, null: false, default: 0
    add_column :spaces, :total_credit_cents, :bigint, null: false, default: 0

    # Backfill from contributions if table exists AND has rows; otherwise from transactions
    if ActiveRecord::Base.connection.table_exists?(:space_member_contributions) && ActiveRecord::Base.connection.select_value("SELECT COUNT(1) FROM space_member_contributions").to_i > 0
      execute <<~SQL.squish
        UPDATE spaces s SET
          total_spend_cents = COALESCE(sub.spend_cents, 0),
          total_credit_cents = COALESCE(sub.credit_cents, 0)
        FROM (
          SELECT space_id, SUM(spend_cents) AS spend_cents, SUM(credit_cents) AS credit_cents
          FROM space_member_contributions
          GROUP BY space_id
        ) sub
        WHERE sub.space_id = s.id
      SQL
    else
      execute <<~SQL.squish
        UPDATE spaces s SET
          total_spend_cents = COALESCE(sub.spend_cents, 0),
          total_credit_cents = COALESCE(sub.credit_cents, 0)
        FROM (
          SELECT space_id,
            SUM(CASE WHEN full_cover = FALSE AND amount_cents < 0 THEN ABS(amount_cents)::bigint ELSE 0 END) AS spend_cents,
            SUM(CASE WHEN full_cover = FALSE AND amount_cents >= 0 THEN amount_cents::bigint ELSE 0 END) AS credit_cents
          FROM transactions
          GROUP BY space_id
        ) sub
        WHERE sub.space_id = s.id
      SQL
    end
  end

  def down
    remove_column :spaces, :total_spend_cents
    remove_column :spaces, :total_credit_cents
  end
end
