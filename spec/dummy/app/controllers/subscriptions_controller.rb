class SubscriptionsController < ApplicationController
  def new
    @subscription = FlyoverSubscriptions::Subscription.new
  end
end