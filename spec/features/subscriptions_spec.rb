require 'rails_helper'

describe "Subscriptions" do
  let(:stripe_js_error) do
    <<-EOS
      Stripe.createToken = function(card, callback){
        callback(500, { "error": {"message": "This card number looks invalid." } });
      };
    EOS
  end

  let(:stripe_js_success) do
    <<-EOS
      Stripe.createToken = function(card, callback){
        callback(200, { "id": "cust_1234" });
      };
    EOS
  end

  let!(:widget){ create(:widget) }

  it "shows the subscription form when a subscriber is not subscribed" do
    visit flyover_subscriptions.subscriptions_path

    expect(page).to have_css 'meta[name="stripe-key"]', visible: false
    expect(page).to have_css("#card_number")
    expect(page).to have_css("#card_code")
    expect(page).to have_css("#card_expiration")
  end

  it "shows subscription info when a subscriber is subscribed" do
    subscription = create(:subscription, subscriber: widget)
    
    visit flyover_subscriptions.subscriptions_path
    expect(page).to have_content "Update Card"
    expect(page).to have_content "Payment History"
    expect(page).to have_content "Cancel Subscription"
  end

  context "with an invalid card number" do
    it "displays an error", js: true do
      visit flyover_subscriptions.subscriptions_path

      expect(page).to have_selector("#card_number")
      page.execute_script stripe_js_error

      fill_in :card_number, with: "123"
      click_button "Subscribe"
      expect(page).to have_content "This card number looks invalid."
    end
  end

  context "with a valid card number", js: true do
    it "fills in the stripe customer token" do
      plan = create :plan
      visit flyover_subscriptions.subscriptions_path

      expect(page).to have_selector("#card_number")
      page.execute_script stripe_js_success

      select plan.name, from: "subscription_plan_id"
      fill_in :card_number, with: "4242424242424242"
      fill_in :card_code, with: "123"
      fill_in :card_expiration, with: "02/19"
      click_button "Subscribe"

      expect(page).to_not have_content "This card number looks invalid."
    end
  end
end