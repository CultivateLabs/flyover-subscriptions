module StripeHelper
  def stripe_customer 
    @stripe_customer ||= begin
      stripe_customer = double(id: "token_123")
      allow(stripe_customer).to receive(:sources).and_return(sources)
      allow(stripe_customer).to receive(:default_source)
      allow(stripe_customer).to receive(:card=).and_return(true)
      allow(stripe_customer).to receive(:save).and_return(true)
      allow(stripe_customer).to receive(:charges).and_return(double(data: []))
      allow(stripe_customer).to receive(:subscriptions).and_return(subscriptions)
      stripe_customer
    end
  end

  def card
    @card ||= begin
      double(last4: "1234")
    end
  end

  def sources
    @sources ||= begin
      sources = double
      allow(sources).to receive(:retrieve).and_return(card)
      sources
    end
  end

  def subscriptions
    @subscriptions ||= begin
      subscriptions = double
      allow(subscriptions).to receive(:first).and_return(stripe_subscription)
      allow(subscriptions).to receive(:total_count)
      subscriptions      
    end
  end

  def stripe_subscription
    @stripe_subscription ||= begin 
      stripe_subscription = double(quantity: 0)
      allow(stripe_subscription).to receive(:quantity=)
      allow(stripe_subscription).to receive(:save).and_return(true)
      stripe_subscription
    end
  end

  def stub_stripe
    allow(Stripe::Customer).to receive(:create).and_return(stripe_customer)
    allow(Stripe::Customer).to receive(:retrieve).and_return(stripe_customer)

    allow(Stripe::Invoice).to receive(:upcoming).and_return(double(total: 100, next_payment_attempt: 7.days.from_now))
  end
end

RSpec.configure do |config|
  config.include StripeHelper
  config.before{ stub_stripe }
end