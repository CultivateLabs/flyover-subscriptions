class AddArchivedAtToFlyoverSubscriptionsSubscriptions < ActiveRecord::Migration
  def change
    add_column :flyover_subscriptions_subscriptions, :archived_at, :datetime
  end
end
