class CreateActivityHistory < ActiveRecord::Migration[8.0]
  def change
    create_table :activity_history do |t|
      t.references :space, null: false, foreign_key: true
      t.references :actor_user, null: true, foreign_key: { to_table: :users }
      t.string :verb, null: false
      t.string :subject_type
      t.bigint :subject_id
      t.jsonb :metadata, null: false, default: {}

      t.timestamps
    end

    add_index :activity_history, [ :space_id, :id ]

    add_check_constraint :activity_history, "verb IN ('created','deleted','updated')", name: "activity_history_verb_allowed"
  end
end
