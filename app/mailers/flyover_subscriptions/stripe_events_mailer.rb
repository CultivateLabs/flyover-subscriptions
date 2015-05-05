module FlyoverSubscriptions
  class StripeEventsMailer < ApplicationMailer

    # Subject can be set in your I18n file at config/locales/en.yml
    # with the following lookup:
    #
    #   en.flyover_subscriptions.stripe_events_mailer.failed_charge_notify_customer.subject
    #
    def failed_charge_notify_customer(subscriber, app_name, signature, greeting="Hi")
      @subscriber = subscriber
      @greeting = greeting
      @app_name = app_name
      @signature = signature

      mail to: @subscriber.email
    end
    def failed_charge_notify_admin(subscriber, app_name)
      @subscriber = subscriber
      @app_name = app_name

      mail to: FlyoverSubscriptions.notifications_admin_email
    end
  end
end
