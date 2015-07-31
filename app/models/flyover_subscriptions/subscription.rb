module FlyoverSubscriptions
  class Subscription < ActiveRecord::Base
    attr_accessor :stripe_card_token
    
    belongs_to :subscriber, polymorphic: true, touch: true
    belongs_to :plan

    # validates_associated :subscriber
    validates_presence_of :plan

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
    rescue => e
      handle_exception(e)
    end

    def set_stripe_quantity_to_zero
      stripe_subscription.quantity = 0
      stripe_subscription.save
      self.update_column("archived_at", Time.now)
    rescue => e
      handle_exception(e)
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
    rescue => e
      handle_exception(e)
    end

    def customer
      ::Stripe.api_key = ENV["STRIPE_SECRET"]
      @customer ||= if self.stripe_customer_token.present? 
        ::Stripe::Customer.retrieve(self.stripe_customer_token)
      else
        params = {description: subscriber.email, email: subscriber.email, plan: plan.stripe_id, card: stripe_card_token}
        params[:coupon] = coupon unless coupon.blank?
        ::Stripe::Customer.create(params)
      end
    rescue => e
      handle_exception(e)
    end

    def stripe_subscription
      @stripe_subscription ||= customer.subscriptions.first
    end

  private
    def create_stripe_subscription
      if !errors.any?
        stripe_customer = customer
        if !errors.any?
          self.stripe_customer_token = stripe_customer.id
          self.last_four = stripe_customer.sources.retrieve(stripe_customer.default_source).last4
        else
          false
        end
      end
    rescue => e
      handle_exception(e)
    end

    def update_stripe_plan
      if self.stripe_card_token.present?
        customer.card = self.stripe_card_token
        customer.save
        self.last_four = customer.sources.retrieve(customer.default_source).last4
      elsif self.archived? || self.will_cancel?
        resubscribe_to_stripe
      elsif self.plan.present?
        if subscriber.respond_to?(:can_update_subscription_to_plan?) && !subscriber.can_update_subscription_to_plan?(self, plan)
          return false 
        end
        
        customer.update_subscription(plan: self.plan.stripe_id, prorate: true)
      end
    rescue => e
      handle_exception(e)
    end

    def handle_exception(e)
      if e.is_a? Stripe::CardError
        self.errors.add :base, e.message
        self.stripe_card_token = nil
        false
      elsif e.is_a? Stripe::InvalidRequestError
        self.errors.add :base, "There was a problem with your credit card."
        false
      elsif e.is_a? Stripe::AuthenticationError
        self.errors.add :base, "There was a problem connecting to Stripe. Please try again."
        false
      elsif e.is_a? Stripe::APIConnectionError
        self.errors.add :base, "There was a problem connecting to Stripe. Please try again."
        false
      elsif e.is_a? Stripe::StripeError
        self.errors.add :base, "There was a problem processing your order. Please try again."
        false
      else
        self.errors.add :base, "There was a problem processing your order. Please try again."
        false
      end
    end
  end
end