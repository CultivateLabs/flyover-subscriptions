class CreateFlyoverSubscriptionsPlans < ActiveRecord::Migration
  def change
    create_table :flyover_subscriptions_plans do |t|
      t.integer :price_in_cents
      t.string :stripe_id
      t.string :interval
      t.string :name

      t.timestamps null: false
    end
  end
end
