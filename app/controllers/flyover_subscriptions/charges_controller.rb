module FlyoverSubscriptions
  class ChargesController < FlyoverSubscriptions::ApplicationController
    def index
      Stripe.api_key = ENV["STRIPE_SECRET"]
      @charges = Stripe::Customer.retrieve(send(FlyoverSubscriptions.current_subscriber_method).subscription.stripe_customer_token).charges
    end
  end
end