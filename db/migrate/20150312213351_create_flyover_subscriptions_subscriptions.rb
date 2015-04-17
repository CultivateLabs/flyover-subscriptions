class CreateFlyoverSubscriptionsSubscriptions < ActiveRecord::Migration
  def change
    create_table :flyover_subscriptions_subscriptions do |t|
      t.references :subscriber, polymorphic: true
      t.string :stripe_customer_token

      t.timestamps null: false
    end
    add_index :flyover_subscriptions_subscriptions, [:subscriber_id, :subscriber_type], name: "index_subscription_on_subscriber"
  end
end
