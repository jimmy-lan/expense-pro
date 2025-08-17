# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[8.0].define(version: 2025_08_09_090600) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "pg_catalog.plpgsql"

  create_table "plans", force: :cascade do |t|
    t.string "key", null: false
    t.string "name", null: false
    t.integer "max_spaces", default: 20, null: false
    t.integer "max_transactions_per_space", default: 500, null: false
    t.integer "expires_after_days"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.integer "max_members_per_space", null: false
    t.integer "deleted_space_retention_hours", default: 4, null: false
    t.index ["key"], name: "index_plans_on_key", unique: true
    t.check_constraint "deleted_space_retention_hours >= 0", name: "plans_deleted_space_retention_non_negative"
    t.check_constraint "max_members_per_space > 0", name: "plans_max_members_positive"
    t.check_constraint "max_spaces > 0", name: "plans_max_spaces_positive"
    t.check_constraint "max_transactions_per_space > 0", name: "plans_max_tx_positive"
  end

  create_table "space_memberships", force: :cascade do |t|
    t.bigint "user_id", null: false
    t.bigint "space_id", null: false
    t.string "role", default: "member", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["space_id", "role"], name: "index_space_memberships_on_space_and_role"
    t.index ["space_id"], name: "index_space_memberships_on_space_id"
    t.index ["user_id", "space_id"], name: "index_space_memberships_on_user_and_space", unique: true
    t.index ["user_id"], name: "index_space_memberships_on_user_id"
    t.check_constraint "role::text = ANY (ARRAY['member'::character varying::text, 'admin'::character varying::text])", name: "space_memberships_role_allowed"
  end

  create_table "spaces", force: :cascade do |t|
    t.string "name", null: false
    t.bigint "created_by_id", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.integer "transactions_count", default: 0, null: false
    t.string "description", limit: 200
    t.datetime "deleted_at"
    t.datetime "purge_after_at"
    t.string "color_hex", limit: 6
    t.index "lower((name)::text), created_by_id", name: "index_spaces_on_lower_name_and_created_by_id", unique: true
    t.index ["created_by_id"], name: "index_spaces_on_created_by_id"
    t.index ["deleted_at"], name: "index_spaces_on_deleted_at"
    t.index ["purge_after_at"], name: "index_spaces_on_purge_after_at"
  end

  create_table "transactions", force: :cascade do |t|
    t.string "title", limit: 100, null: false
    t.text "description"
    t.string "amount", null: false
    t.datetime "occurred_at", null: false
    t.bigint "space_id", null: false
    t.bigint "creator_id", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.boolean "full_cover", default: false, null: false
    t.index ["creator_id"], name: "index_transactions_on_creator_id"
    t.index ["space_id", "created_at"], name: "index_transactions_on_space_and_created_at"
    t.index ["space_id", "occurred_at", "id"], name: "index_transactions_on_space_and_occurred_at_and_id"
    t.index ["space_id", "occurred_at"], name: "index_transactions_on_space_and_occurred_at"
    t.index ["space_id"], name: "index_transactions_on_space_id"
    t.check_constraint "amount::text ~ '^[-]?[0-9]+(\\.[0-9]{1,2})?$'::text", name: "transactions_amount_decimal_string"
  end

  create_table "users", force: :cascade do |t|
    t.string "email", null: false
    t.string "first_name", null: false
    t.string "last_name", null: false
    t.string "password_digest"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.bigint "plan_id", null: false
    t.integer "created_spaces_count", default: 0, null: false
    t.string "avatar_bg_hex", limit: 6
    t.string "avatar_fg", limit: 5
    t.index "lower((email)::text)", name: "index_users_on_lower_email", unique: true
    t.index ["plan_id"], name: "index_users_on_plan_id"
  end

  add_foreign_key "space_memberships", "spaces"
  add_foreign_key "space_memberships", "users"
  add_foreign_key "spaces", "users", column: "created_by_id"
  add_foreign_key "transactions", "spaces"
  add_foreign_key "transactions", "users", column: "creator_id"
  add_foreign_key "users", "plans"
end
