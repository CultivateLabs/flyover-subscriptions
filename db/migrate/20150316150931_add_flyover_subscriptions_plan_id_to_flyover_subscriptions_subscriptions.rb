class AddFlyoverSubscriptionsPlanIdToFlyoverSubscriptionsSubscriptions < ActiveRecord::Migration
  def change
    add_column :flyover_subscriptions_subscriptions, :plan_id, :integer
    add_index :flyover_subscriptions_subscriptions, :plan_id
  end
end
