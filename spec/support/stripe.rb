module StripeHelper
  def customer 
    @customer ||= begin
      customer = double(id: "token_123")
      allow(customer).to receive(:sources).and_return(sources)
      allow(customer).to receive(:default_source)
      allow(customer).to receive(:card=).and_return(true)
      allow(customer).to receive(:charges).and_return(double(data: []))
      allow(customer).to receive(:subscriptions).and_return(subscriptions)
      customer
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
      allow(subscriptions).to receive(:first).and_return(subscription)
      subscriptions      
    end
  end

  def subscription
    @subscription ||= begin 
      subscription = double(quantity: 0)
      allow(subscription).to receive(:quantity=)
      allow(subscription).to receive(:save).and_return(true)
      subscription
    end
  end

  def stub_stripe
    allow(Stripe::Customer).to receive(:create).and_return(customer)
    allow(Stripe::Customer).to receive(:retrieve).and_return(customer)

    allow(Stripe::Invoice).to receive(:upcoming).and_return(double(total: 100, next_payment_attempt: 7.days.from_now))
  end
end

RSpec.configure do |config|
  config.include StripeHelper
  config.before{ stub_stripe }
end