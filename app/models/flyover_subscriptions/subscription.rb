module FlyoverSubscriptions
  class Subscription < ActiveRecord::Base
    attr_accessor :stripe_card_token
    
    belongs_to :subscriber, polymorphic: true
    belongs_to :plan

    validates_associated :subscriber

    before_create :create_stripe_subscription
    before_update :update_stripe_plan
    before_destroy :cancel_stripe_subscription

    def archived?
      self.archived_at.present? && self.archived_at <= Time.now
    end

    def will_cancel?
      self.archived_at.present? && self.archived_at > Time.now
    end

    def stripe_card_token=(token)
      attribute_will_change!(:stripe_customer_token)
      @stripe_card_token = token
    end

    def cancel_stripe_subscription(at_period_end = false)
      response = stripe_subscription.delete(at_period_end: at_period_end)
      cancel_time = at_period_end ? Time.at(response.current_period_end) : Time.now
      self.update_column("archived_at", cancel_time)
    rescue ::Stripe::InvalidRequestError => e
      logger.error "Stripe error while canceling subscription: #{e.message}"
      errors.add :base, "There was a problem canceling your subscription plan."
      false
    end

    def set_stripe_quantity_to_zero
      stripe_subscription.quantity = 0
      stripe_subscription.save
      self.update_column("archived_at", Time.now)
    rescue ::Stripe::InvalidRequestError => e
      logger.error "Stripe error while updating subscription: #{e.message}"
      errors.add :base, "There was a problem updating your subscription."
      false
    end

    def resubscribe_to_stripe
      if customer.subscriptions.total_count > 0
        stripe_subscription.plan = self.plan.stripe_id
        stripe_subscription.save
        self.update_column("archived_at", nil)
      else
        customer.subscriptions.create(plan: self.plan.stripe_id)
        self.update_column("archived_at", nil)
      end
    rescue ::Stripe::InvalidRequestError => e
      logger.error "Stripe error while updating subscription: #{e.message}"
      errors.add :base, "There was a problem updating your subscription."
      false
    end

    def customer
      ::Stripe.api_key = ENV["STRIPE_SECRET"]
      @customer ||= if self.stripe_customer_token.present? 
        ::Stripe::Customer.retrieve(self.stripe_customer_token)
      else
        ::Stripe::Customer.create(description: subscriber.email, email: subscriber.email, plan: plan.stripe_id, card: stripe_card_token)
      end
    end

    def stripe_subscription
      @stripe_subscription ||= customer.subscriptions.first
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
      elsif self.archived? || self.will_cancel?
        resubscribe_to_stripe
      elsif self.plan.present?
        customer.update_subscription(plan: self.plan.stripe_id, prorate: true)
      end
    rescue ::Stripe::InvalidRequestError => e
      logger.error "Stripe error while updating plan: #{e.message}"
      errors.add :base, "There was a problem updating your subscription plan."
      false
    end
  end
end