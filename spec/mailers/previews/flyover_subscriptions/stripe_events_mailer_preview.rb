module FlyoverSubscriptions
  # Preview all emails at http://localhost:3000/rails/mailers/flyover_subscriptions/stripe_events_mailer
  class StripeEventsMailerPreview < ActionMailer::Preview

    # Preview this email at http://localhost:3000/rails/mailers/flyover_subscriptions/stripe_events_mailer/invoice_payment_failed_notify_customer
    def invoice_payment_failed_notify_customer
      StripeEventsMailer.invoice_payment_failed_notify_customer(FlyoverSubscriptions::Subscription.first.subscriber)
    end
  end
end