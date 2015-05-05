require "rails_helper"

module FlyoverSubscriptions
  RSpec.describe StripeEventsMailer, type: :mailer do
    describe "failed_charge_notify_customer" do
      let(:mail) { StripeEventsMailer.failed_charge_notify_customer(double(email: "to@example.org"), "Test App", "The Team", "Greetings") }

      it "renders the headers" do
        expect(mail.subject).to eq I18n.t('flyover_subscriptions.stripe_events_mailer.failed_charge_notify_customer.subject')
        expect(mail.to).to eq(["to@example.org"])
        expect(mail.from).to eq(["noreply@example.com"])
      end

      it "renders the body" do
        expect(mail.body.encoded).to match("Greetings")
      end
    end

    describe "failed_charge_notify_admin" do
      let(:mail) { StripeEventsMailer.failed_charge_notify_admin(double(email: "to@example.org"), "Test App") }

      it "renders the headers" do
        expect(mail.subject).to eq I18n.t('flyover_subscriptions.stripe_events_mailer.failed_charge_notify_customer.subject')
        expect(mail.to).to eq(["to@example.org"])
        expect(mail.from).to eq(["noreply@example.com"])
      end

      it "renders the body" do
        expect(mail.body.encoded).to match("there was a problem")
      end
    end

  end
end
