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

ActiveRecord::Schema[8.0].define(version: 2025_10_12_090020) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "pg_catalog.plpgsql"

  create_table "activity_history", force: :cascade do |t|
    t.bigint "space_id", null: false
    t.bigint "actor_user_id"
    t.string "verb", null: false
    t.string "subject_type"
    t.bigint "subject_id"
    t.jsonb "metadata", default: {}, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["actor_user_id"], name: "index_activity_history_on_actor_user_id"
    t.index ["space_id", "id"], name: "index_activity_history_on_space_id_and_id"
    t.index ["space_id"], name: "index_activity_history_on_space_id"
    t.check_constraint "verb::text = ANY (ARRAY['created'::character varying, 'deleted'::character varying, 'updated'::character varying]::text[])", name: "activity_history_verb_allowed"
  end

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

  create_table "solid_queue_blocked_executions", force: :cascade do |t|
    t.bigint "job_id", null: false
    t.string "queue_name", null: false
    t.integer "priority", default: 0, null: false
    t.string "concurrency_key", null: false
    t.datetime "expires_at", null: false
    t.datetime "created_at", null: false
    t.index ["concurrency_key", "priority", "job_id"], name: "index_solid_queue_blocked_executions_for_release"
    t.index ["expires_at", "concurrency_key"], name: "index_solid_queue_blocked_executions_for_maintenance"
    t.index ["job_id"], name: "index_solid_queue_blocked_executions_on_job_id", unique: true
  end

  create_table "solid_queue_claimed_executions", force: :cascade do |t|
    t.bigint "job_id", null: false
    t.bigint "process_id"
    t.datetime "created_at", null: false
    t.index ["job_id"], name: "index_solid_queue_claimed_executions_on_job_id", unique: true
    t.index ["process_id", "job_id"], name: "index_solid_queue_claimed_executions_on_process_id_and_job_id"
  end

  create_table "solid_queue_failed_executions", force: :cascade do |t|
    t.bigint "job_id", null: false
    t.text "error"
    t.datetime "created_at", null: false
    t.index ["job_id"], name: "index_solid_queue_failed_executions_on_job_id", unique: true
  end

  create_table "solid_queue_jobs", force: :cascade do |t|
    t.string "queue_name", null: false
    t.string "class_name", null: false
    t.text "arguments"
    t.integer "priority", default: 0, null: false
    t.string "active_job_id"
    t.datetime "scheduled_at"
    t.datetime "finished_at"
    t.string "concurrency_key"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["active_job_id"], name: "index_solid_queue_jobs_on_active_job_id"
    t.index ["class_name"], name: "index_solid_queue_jobs_on_class_name"
    t.index ["finished_at"], name: "index_solid_queue_jobs_on_finished_at"
    t.index ["queue_name", "finished_at"], name: "index_solid_queue_jobs_for_filtering"
    t.index ["scheduled_at", "finished_at"], name: "index_solid_queue_jobs_for_alerting"
  end

  create_table "solid_queue_pauses", force: :cascade do |t|
    t.string "queue_name", null: false
    t.datetime "created_at", null: false
    t.index ["queue_name"], name: "index_solid_queue_pauses_on_queue_name", unique: true
  end

  create_table "solid_queue_processes", force: :cascade do |t|
    t.string "kind", null: false
    t.datetime "last_heartbeat_at", null: false
    t.bigint "supervisor_id"
    t.integer "pid", null: false
    t.string "hostname"
    t.text "metadata"
    t.datetime "created_at", null: false
    t.string "name", null: false
    t.index ["last_heartbeat_at"], name: "index_solid_queue_processes_on_last_heartbeat_at"
    t.index ["name", "supervisor_id"], name: "index_solid_queue_processes_on_name_and_supervisor_id", unique: true
    t.index ["supervisor_id"], name: "index_solid_queue_processes_on_supervisor_id"
  end

  create_table "solid_queue_ready_executions", force: :cascade do |t|
    t.bigint "job_id", null: false
    t.string "queue_name", null: false
    t.integer "priority", default: 0, null: false
    t.datetime "created_at", null: false
    t.index ["job_id"], name: "index_solid_queue_ready_executions_on_job_id", unique: true
    t.index ["priority", "job_id"], name: "index_solid_queue_poll_all"
    t.index ["queue_name", "priority", "job_id"], name: "index_solid_queue_poll_by_queue"
  end

  create_table "solid_queue_recurring_executions", force: :cascade do |t|
    t.bigint "job_id", null: false
    t.string "task_key", null: false
    t.datetime "run_at", null: false
    t.datetime "created_at", null: false
    t.index ["job_id"], name: "index_solid_queue_recurring_executions_on_job_id", unique: true
    t.index ["task_key", "run_at"], name: "index_solid_queue_recurring_executions_on_task_key_and_run_at", unique: true
  end

  create_table "solid_queue_recurring_tasks", force: :cascade do |t|
    t.string "key", null: false
    t.string "schedule", null: false
    t.string "command", limit: 2048
    t.string "class_name"
    t.text "arguments"
    t.string "queue_name"
    t.integer "priority", default: 0
    t.boolean "static", default: true, null: false
    t.text "description"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["key"], name: "index_solid_queue_recurring_tasks_on_key", unique: true
    t.index ["static"], name: "index_solid_queue_recurring_tasks_on_static"
  end

  create_table "solid_queue_scheduled_executions", force: :cascade do |t|
    t.bigint "job_id", null: false
    t.string "queue_name", null: false
    t.integer "priority", default: 0, null: false
    t.datetime "scheduled_at", null: false
    t.datetime "created_at", null: false
    t.index ["job_id"], name: "index_solid_queue_scheduled_executions_on_job_id", unique: true
    t.index ["scheduled_at", "priority", "job_id"], name: "index_solid_queue_dispatch_all"
  end

  create_table "solid_queue_semaphores", force: :cascade do |t|
    t.string "key", null: false
    t.integer "value", default: 1, null: false
    t.datetime "expires_at", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["expires_at"], name: "index_solid_queue_semaphores_on_expires_at"
    t.index ["key", "value"], name: "index_solid_queue_semaphores_on_key_and_value"
    t.index ["key"], name: "index_solid_queue_semaphores_on_key", unique: true
  end

  create_table "space_member_contributions", force: :cascade do |t|
    t.bigint "space_id", null: false
    t.bigint "user_id", null: false
    t.bigint "spend_cents", default: 0, null: false
    t.bigint "credit_cents", default: 0, null: false
    t.bigint "full_cover_cents", default: 0, null: false
    t.integer "transactions_count", default: 0, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["space_id", "user_id"], name: "index_contributions_on_space_and_user", unique: true
    t.index ["space_id"], name: "index_space_member_contributions_on_space_id"
  end

  create_table "space_memberships", force: :cascade do |t|
    t.bigint "user_id", null: false
    t.bigint "space_id", null: false
    t.string "role", default: "member", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.bigint "last_seen_activity_id", default: 0, null: false
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
    t.bigint "total_spend_cents", default: 0, null: false
    t.bigint "total_credit_cents", default: 0, null: false
    t.bigint "latest_activity_id", default: 0, null: false
    t.index "lower((name)::text), created_by_id", name: "index_spaces_on_lower_name_and_created_by_id", unique: true
    t.index ["created_by_id"], name: "index_spaces_on_created_by_id"
    t.index ["deleted_at"], name: "index_spaces_on_deleted_at"
    t.index ["purge_after_at"], name: "index_spaces_on_purge_after_at"
  end

  create_table "transactions", force: :cascade do |t|
    t.string "title", limit: 100, null: false
    t.text "description"
    t.datetime "occurred_at", null: false
    t.bigint "space_id", null: false
    t.bigint "creator_id", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.boolean "full_cover", default: false, null: false
    t.bigint "amount_cents", null: false
    t.index ["creator_id"], name: "index_transactions_on_creator_id"
    t.index ["space_id", "created_at"], name: "index_transactions_on_space_and_created_at"
    t.index ["space_id", "occurred_at", "id"], name: "index_transactions_on_space_and_occurred_at_and_id"
    t.index ["space_id", "occurred_at"], name: "index_transactions_on_space_and_occurred_at"
    t.index ["space_id"], name: "index_transactions_on_space_id"
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

  add_foreign_key "activity_history", "spaces"
  add_foreign_key "activity_history", "users", column: "actor_user_id"
  add_foreign_key "solid_queue_blocked_executions", "solid_queue_jobs", column: "job_id", on_delete: :cascade
  add_foreign_key "solid_queue_claimed_executions", "solid_queue_jobs", column: "job_id", on_delete: :cascade
  add_foreign_key "solid_queue_failed_executions", "solid_queue_jobs", column: "job_id", on_delete: :cascade
  add_foreign_key "solid_queue_ready_executions", "solid_queue_jobs", column: "job_id", on_delete: :cascade
  add_foreign_key "solid_queue_recurring_executions", "solid_queue_jobs", column: "job_id", on_delete: :cascade
  add_foreign_key "solid_queue_scheduled_executions", "solid_queue_jobs", column: "job_id", on_delete: :cascade
  add_foreign_key "space_member_contributions", "spaces"
  add_foreign_key "space_member_contributions", "users"
  add_foreign_key "space_memberships", "spaces"
  add_foreign_key "space_memberships", "users"
  add_foreign_key "spaces", "users", column: "created_by_id"
  add_foreign_key "transactions", "spaces"
  add_foreign_key "transactions", "users", column: "creator_id"
  add_foreign_key "users", "plans"
end
