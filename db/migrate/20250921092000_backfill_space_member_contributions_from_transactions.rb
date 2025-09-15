class BackfillSpaceMemberContributionsFromTransactions < ActiveRecord::Migration[8.0]
  def up
    return unless ActiveRecord::Base.connection.table_exists?(:space_member_contributions)

    # Initialize rows for any (space_id, creator_id) pairs that are missing
    execute <<~SQL.squish
      INSERT INTO space_member_contributions (space_id, user_id, spend_cents, credit_cents, full_cover_cents, transactions_count, created_at, updated_at)
      SELECT t.space_id, t.creator_id, 0, 0, 0, 0, NOW(), NOW()
      FROM transactions t
      LEFT JOIN space_member_contributions c
        ON c.space_id = t.space_id AND c.user_id = t.creator_id
      GROUP BY t.space_id, t.creator_id, c.space_id, c.user_id
      HAVING c.space_id IS NULL
    SQL

    # Aggregate and backfill counters
    execute <<~SQL.squish
      WITH agg AS (
        SELECT
          t.space_id,
          t.creator_id AS user_id,
          SUM(CASE WHEN t.full_cover = TRUE THEN ABS(t.amount_cents)::bigint ELSE 0 END) AS full_cover_cents,
          SUM(CASE WHEN t.full_cover = FALSE AND t.amount_cents < 0 THEN ABS(t.amount_cents)::bigint ELSE 0 END) AS spend_cents,
          SUM(CASE WHEN t.full_cover = FALSE AND t.amount_cents >= 0 THEN t.amount_cents::bigint ELSE 0 END) AS credit_cents,
          COUNT(*) AS transactions_count
        FROM transactions t
        GROUP BY t.space_id, t.creator_id
      )
      UPDATE space_member_contributions c
      SET
        spend_cents = a.spend_cents,
        credit_cents = a.credit_cents,
        full_cover_cents = a.full_cover_cents,
        transactions_count = a.transactions_count,
        updated_at = NOW()
      FROM agg a
      WHERE c.space_id = a.space_id AND c.user_id = a.user_id
    SQL

    # Recompute memoized totals on spaces now that contributions are backfilled
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
  end

  def down
    # No-op: we don't want to lose counters
  end
end
