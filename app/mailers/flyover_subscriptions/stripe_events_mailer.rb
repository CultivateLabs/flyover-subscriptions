module FlyoverSubscriptions
  class StripeEventsMailer < ApplicationMailer

    # Subject can be set in your I18n file at config/locales/en.yml
    # with the following lookup:
    #
    #   en.stripe_events_mailer.failed_charge_notify_customer.subject
    #
    def failed_charge_notify_customer(subscriber)
      @subscriber = subscriber
      @greeting = "Hi"

      mail to: @subscriber.email
    end
  end
end
