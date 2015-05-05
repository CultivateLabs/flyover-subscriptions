module FlyoverSubscriptions
  # Preview all emails at http://localhost:3000/rails/mailers/flyover_subscriptions/stripe_events
  class StripeEventsMailerPreview < ActionMailer::Preview

    # Preview this email at http://localhost:3000/rails/mailers/flyover_subscriptions/stripe_events/failed_charge_notify_customer
    def failed_charge_notify_customer
      StripeEventsMailer.failed_charge_notify_customer
    end

  end
end
