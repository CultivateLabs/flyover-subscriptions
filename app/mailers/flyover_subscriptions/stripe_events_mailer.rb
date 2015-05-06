module FlyoverSubscriptions
  class StripeEventsMailer < ApplicationMailer

    # Subject can be set in your I18n file at config/locales/en.yml
    # with the following lookup:
    #
    #   en.flyover_subscriptions.stripe_events_mailer.invoice_payment_failed_notify_customer.subject
    #
    def invoice_payment_failed_notify_customer(subscriber, app_name, signature, greeting="Hi")
      @subscriber = subscriber
      @greeting = greeting
      @app_name = app_name
      @signature = signature

      mail to: @subscriber.email
    end
    def invoice_payment_failed_notify_admin(subscriber, app_name, invoice_id)
      @subscriber = subscriber
      @app_name = app_name
      @invoice_id = invoice_id

      mail to: FlyoverSubscriptions.notifications_admin_email
    end
  end
end
