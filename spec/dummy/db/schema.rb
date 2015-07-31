# encoding: UTF-8
# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# Note that this schema.rb definition is the authoritative source for your
# database schema. If you need to create the application database on another
# system, you should be using db:schema:load, not running all the migrations
# from scratch. The latter is a flawed and unsustainable approach (the more migrations
# you'll amass, the slower it'll run and the greater likelihood for issues).
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema.define(version: 20150730223414) do

  # These are extensions that must be enabled in order to support this database
  enable_extension "plpgsql"

  create_table "flyover_subscriptions_plans", force: :cascade do |t|
    t.integer  "price_in_cents"
    t.string   "stripe_id"
    t.string   "interval"
    t.string   "name"
    t.datetime "created_at",     null: false
    t.datetime "updated_at",     null: false
  end

  create_table "flyover_subscriptions_subscriptions", force: :cascade do |t|
    t.integer  "subscriber_id"
    t.string   "subscriber_type"
    t.string   "stripe_customer_token"
    t.datetime "created_at",            null: false
    t.datetime "updated_at",            null: false
    t.integer  "plan_id"
    t.string   "last_four"
    t.datetime "archived_at"
    t.string   "coupon"
  end

  add_index "flyover_subscriptions_subscriptions", ["plan_id"], name: "index_flyover_subscriptions_subscriptions_on_plan_id", using: :btree
  add_index "flyover_subscriptions_subscriptions", ["subscriber_id", "subscriber_type"], name: "index_subscription_on_subscriber", using: :btree

  create_table "widgets", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
  end

end
