require "rails_helper"

module FlyoverSubscriptions
  RSpec.describe StripeEventsMailer, type: :mailer do
    describe "invoice_payment_failed_notify_customer" do
      let(:mail) { StripeEventsMailer.invoice_payment_failed_notify_customer(double(email: "to@example.org"), "Test App", "The Team", "Greetings") }

      it "renders the headers" do
        expect(mail.subject).to eq I18n.t('flyover_subscriptions.stripe_events_mailer.invoice_payment_failed_notify_customer.subject')
        expect(mail.to).to eq(["to@example.org"])
        expect(mail.from).to eq(["noreply@example.com"])
      end

      it "renders the body" do
        expect(mail.body.encoded).to match("Greetings")
      end
    end

    describe "invoice_payment_failed_notify_admin" do
      let(:mail) { StripeEventsMailer.invoice_payment_failed_notify_admin(double(email: "to@example.org"), "Test App", "ch_123") }

      it "renders the headers" do
        expect(mail.subject).to eq I18n.t('flyover_subscriptions.stripe_events_mailer.invoice_payment_failed_notify_customer.subject')
        expect(mail.to).to eq([FlyoverSubscriptions.notifications_admin_email])
        expect(mail.from).to eq(["noreply@example.com"])
      end

      it "renders the body" do
        expect(mail.body.encoded).to match("there was a problem")
      end
    end

    describe "subscription_deleted_notify_customer" do
      let(:mail) { StripeEventsMailer.subscription_deleted_notify_customer(double(email: "to@example.org"), "Test App", "The Team", "Greetings") }

      it "renders the headers" do
        expect(mail.subject).to eq I18n.t('flyover_subscriptions.stripe_events_mailer.subscription_deleted_notify_customer.subject')
        expect(mail.to).to eq(["to@example.org"])
        expect(mail.from).to eq(["noreply@example.com"])
      end

      it "renders the body" do
        expect(mail.body.encoded).to match("Greetings")
      end
    end

    describe "subscription_deleted_notify_admin" do
      let(:mail) { StripeEventsMailer.subscription_deleted_notify_admin(double(email: "to@example.org"), "Test App", "ch_123") }

      it "renders the headers" do
        expect(mail.subject).to eq I18n.t('flyover_subscriptions.stripe_events_mailer.subscription_deleted_notify_customer.subject')
        expect(mail.to).to eq([FlyoverSubscriptions.notifications_admin_email])
        expect(mail.from).to eq(["noreply@example.com"])
      end

      it "renders the body" do
        expect(mail.body.encoded).to match("subscription was cancelled")
      end
    end

  end
end
