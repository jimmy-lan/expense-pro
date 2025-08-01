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

ActiveRecord::Schema[8.0].define(version: 2025_08_08_051959) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "pg_catalog.plpgsql"

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
    t.check_constraint "role::text = ANY (ARRAY['member'::character varying, 'admin'::character varying]::text[])", name: "space_memberships_role_allowed"
  end

  create_table "spaces", force: :cascade do |t|
    t.string "name", null: false
    t.bigint "created_by_id", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["created_by_id"], name: "index_spaces_on_created_by_id"
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
    t.index ["creator_id"], name: "index_transactions_on_creator_id"
    t.index ["space_id", "occurred_at"], name: "index_transactions_on_space_and_occurred_at"
    t.index ["space_id"], name: "index_transactions_on_space_id"
    t.check_constraint "amount::text ~ '^[0-9]+(\\.[0-9]{1,2})?$'::text", name: "transactions_amount_decimal_string"
  end

  create_table "users", force: :cascade do |t|
    t.string "email", null: false
    t.string "first_name", null: false
    t.string "last_name", null: false
    t.string "password_digest"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index "lower((email)::text)", name: "index_users_on_lower_email", unique: true
  end

  add_foreign_key "space_memberships", "spaces"
  add_foreign_key "space_memberships", "users"
  add_foreign_key "spaces", "users", column: "created_by_id"
  add_foreign_key "transactions", "spaces"
  add_foreign_key "transactions", "users", column: "creator_id"
end
