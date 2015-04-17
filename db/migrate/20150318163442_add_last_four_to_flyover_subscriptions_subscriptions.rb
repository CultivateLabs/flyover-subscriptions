class AddLastFourToFlyoverSubscriptionsSubscriptions < ActiveRecord::Migration
  def change
    add_column :flyover_subscriptions_subscriptions, :last_four, :string
  end
end
