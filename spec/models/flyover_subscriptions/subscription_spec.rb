require 'rails_helper'

module FlyoverSubscriptions
  RSpec.describe Subscription, type: :model do
    it "creates a subscription with a stripe_customer_token" do
      subscription = create(:subscription)
      expect(subscription).to be_valid
      expect(subscription.stripe_customer_token).to eq "token_123"
    end

    it "updates a subscription's plan" do
      subscription = create(:subscription)
      new_plan = create(:plan)
      expect(stripe_customer).to receive(:update_subscription).with(plan: new_plan.stripe_id, prorate: true).and_return(true)
      subscription.plan = new_plan
      subscription.save
      expect(subscription.plan).to eq new_plan
    end

    it "updates the customer's card" do
      expect(stripe_customer).to receive(:card=)
      expect(stripe_customer).to receive(:save)
      expect(stripe_customer).not_to receive(:update_subscription)
      expect(stripe_subscription).not_to receive(:quantity=)

      subscription = create(:subscription)
      subscription.stripe_card_token = "new_token"
      subscription.save
    end

    it "sets the quantity to zero in Stripe" do
      subscription = create(:subscription)
      expect(stripe_subscription).to receive(:quantity=).with(0)
      expect(stripe_customer).not_to receive(:card=)
      expect(stripe_customer).not_to receive(:update_subscription)

      subscription.set_quantity_to_zero
      expect(subscription.archived).to be_truthy
    end

    it "resubscribes a customer by setting quantity to 1 when an archived subscription is updated" do
      subscription = create(:subscription, archived: true)
      expect(stripe_subscription).to receive(:quantity=).with(1)
      expect(stripe_customer).not_to receive(:card=)
      expect(stripe_customer).not_to receive(:update_subscription)
      subscription.updated_at = Time.now
      subscription.save
      expect(subscription.archived).to be_falsy
    end

    it "cancels the stripe subscription when the subscriber is deleted" do
      subscription = create(:subscription)
      
      expect(stripe_customer).to receive(:cancel_subscription)
      expect{
        subscription.subscriber.destroy
      }.to change(FlyoverSubscriptions::Subscription, :count).by(-1)
    end
  end
end
