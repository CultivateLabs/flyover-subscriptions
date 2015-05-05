require "rails_helper"

module FlyoverSubscriptions
  RSpec.describe StripeEventsMailer, type: :mailer do
    describe "failed_charge_notify_customer" do
      let(:mail) { StripeEventsMailer.failed_charge_notify_customer(double(email: "to@example.org")) }

      it "renders the headers" do
        expect(mail.subject).to eq("Failed charge notify customer")
        expect(mail.to).to eq(["to@example.org"])
        expect(mail.from).to eq(["noreply@example.com"])
      end

      it "renders the body" do
        expect(mail.body.encoded).to match("Hi")
      end
    end

  end
end
