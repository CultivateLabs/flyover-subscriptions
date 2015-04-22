class AddArchivedToSubscriptions < ActiveRecord::Migration
  def change
    add_column :flyover_subscriptions_subscriptions, :archived, :boolean, default: false
  end
end
