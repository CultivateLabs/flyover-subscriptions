module FlyoverSubscriptions
  class SubscriptionsController < FlyoverSubscriptions::ApplicationController
    def index
      @subscription = if subscriber.subscription.present?
        subscriber.subscription
      else
        subscriber.build_subscription
      end
      load_charges if !@subscription.new_record?
    end

    def create
      @subscription = subscriber.build_subscription(subscription_params)
      @subscription.plan = subscriber.flyover_subscription_plan if subscriber.flyover_subscription_plan.present?

      if @subscription.save
        redirect_to subscriptions_path, notice: "You have subscribed successfully!"
      else
        render :index
      end
    end

    def update
      @subscription = subscriber.subscription
      @subscription.plan = subscriber.flyover_subscription_plan if subscriber.flyover_subscription_plan.present?

      if @subscription.update(subscription_params)
        redirect_to subscriptions_path, notice: "Your subscription was updated successfully!"
      else
        render :index
      end
    end

    def destroy
      @subscription = subscriber.subscription
      @subscription.set_quantity_to_zero
      redirect_to subscriptions_path, notice: "You have unsubscribed successfully."
    end

  private
    def load_charges
      Stripe.api_key = ENV["STRIPE_SECRET"]
      @charges = Stripe::Customer.retrieve(@subscription.stripe_customer_token).charges
      @upcoming_invoices = Stripe::Invoice.upcoming(customer: @subscription.stripe_customer_token)
    end

    def subscription_params
      params.require(:subscription).permit(:id, :plan_id, :stripe_card_token)
    end

    def subscriber
      @subscriber ||= send(FlyoverSubscriptions.current_subscriber_method)
    end
  end
end