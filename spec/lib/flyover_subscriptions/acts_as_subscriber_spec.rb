require 'rails_helper'

module FlyoverSubscriptions
  RSpec.describe ActsAsSubscriber do
    it "adds a has_one subscription association" do
      expect(Widget.new).to have_one(:subscription).class_name("FlyoverSubscriptions::Subscription")
    end

    describe "#has_subscription?" do
      it "returns true if a subscription is present" do
        widget = build(:widget)
        create(:subscription, subscriber: widget)
        expect(widget.has_subscription?).to be_truthy
      end

      it "returns false if a subscription is archived" do
        widget = build(:widget)
        create(:subscription, subscriber: widget, archived_at: 2.weeks.ago)
        expect(widget.has_subscription?).to be_falsy
      end

      it "returns false if no subscription is present" do
        widget = build(:widget)
        expect(widget.has_subscription?).to be_falsy
      end
    end
  end
end