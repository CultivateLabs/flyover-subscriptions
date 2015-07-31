class AddCouponToSubscriptions < ActiveRecord::Migration
  def change
    add_column :flyover_subscriptions_subscriptions, :coupon, :string
  end
end
