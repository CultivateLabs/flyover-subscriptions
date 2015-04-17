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
      expect(@customer).to receive(:update_subscription).and_return(true)
      subscription.plan = new_plan
      subscription.save
      expect(subscription.plan).to eq new_plan
    end

    it "cancels a subscription by removing the plan" do
      subscription = create(:subscription)
      expect(@customer).to receive(:cancel_subscription).and_return(true)
      subscription.plan = nil
      subscription.save
      expect(subscription.plan).to be_nil
    end

    it "cancels a subscription by removing the plan" do
      subscription = create(:subscription)
      subscription.stripe_card_token = "token"
      expect(@customer).to receive(:save).and_return(true)
      subscription.save
    end
  end
end
