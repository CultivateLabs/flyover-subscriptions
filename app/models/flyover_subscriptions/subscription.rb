module FlyoverSubscriptions
  class Subscription < ActiveRecord::Base
    attr_accessor :stripe_card_token
    
    belongs_to :subscriber, polymorphic: true
    belongs_to :plan

    validates_associated :subscriber

    before_create :create_stripe_subscription
    before_update :update_stripe_plan
    before_destroy :cancel_stripe_subscription

    def stripe_card_token=(token)
      attribute_will_change!(:stripe_customer_token)
      @stripe_card_token = token
    end

    def cancel_stripe_subscription
      customer.cancel_subscription
      self.update_column("archived", true)
    rescue ::Stripe::InvalidRequestError => e
      logger.error "Stripe error while cancelling subscription: #{e.message}"
      errors.add :base, "There was a problem cancelling your subscription plan."
      false
    end

    def customer
      ::Stripe.api_key = ENV["STRIPE_SECRET"]
      @customer ||= if self.stripe_customer_token.present? 
        ::Stripe::Customer.retrieve(self.stripe_customer_token)
      else
        ::Stripe::Customer.create(description: self.subscriber.email, email: self.subscriber.email, plan: self.plan.stripe_id, card: self.stripe_card_token)
      end
    end

  private
    def create_stripe_subscription
      if valid?
        self.stripe_customer_token = customer.id
        self.last_four = customer.sources.retrieve(customer.default_source).last4
      end
    rescue ::Stripe::InvalidRequestError => e
      logger.error "Stripe error while creating subscription: #{e.message}"
      errors.add :base, "There was a problem with your credit card."
      false
    end

    def update_stripe_plan
      if self.stripe_card_token.present?
        customer.card = self.stripe_card_token
        customer.save
        self.last_four = customer.sources.retrieve(customer.default_source).last4
      elsif self.archived?
        customer.subscriptions.create(plan: self.plan.stripe_id)
        self.update_column("archived", false)
      elsif self.plan.present?
        customer.update_subscription(plan: self.plan.stripe_id, prorate: true)
        self.last_four = customer.sources.retrieve(customer.default_source).last4
      end
    rescue ::Stripe::InvalidRequestError => e
      logger.error "Stripe error while updating plan: #{e.message}"
      errors.add :base, "There was a problem updating your subscription plan."
      false
    end
  end
end