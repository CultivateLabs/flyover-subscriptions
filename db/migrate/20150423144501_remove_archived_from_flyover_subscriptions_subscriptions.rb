class RemoveArchivedFromFlyoverSubscriptionsSubscriptions < ActiveRecord::Migration
  def change
    remove_column :flyover_subscriptions_subscriptions, :archived, :boolean, default: false 
  end
end
