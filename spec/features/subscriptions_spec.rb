require 'rails_helper'

describe "Subscriptions" do
  before(:all) do
    server = FakeStripeServer.boot
    Stripe.api_base = 'http://' + [server.host, server.port].join(':')
  end
 
  before do
    StripeMock.start
    #StripeMock.toggle_debug(true)
    @stripe = StripeMock.create_test_helper
    # @stripe.create_plan(id: 'basic')
    # @stripe.create_plan(id: 'standard')
  end
 
  after do
    StripeMock.stop
  end

  it "visits the new subscriptions page and renders the proper META tag" do
    visit main_app.new_subscription_path
    expect(page).to have_css 'meta[name="stripe-key"]', visible: false
  end

  context "with an invalid card number" do
    it "displays an error", js: true do
      visit main_app.new_subscription_path
      fill_in :card_number, with: "123"
      click_button "Create Subscription"
      expect(page).to have_content "This card number looks invalid."
    end
  end

  it "shows the subscription form when a subscriber is not subscribed" do
    create(:widget)
    visit flyover_subscriptions.subscriptions_path
    expect(page).to have_css("#card_number")
    expect(page).to have_css("#card_code")
    expect(page).to have_css("#card_expiration")
  end

  it "shows the subscription form when a subscriber is not subscribed" do
    widget = create(:widget)
    subscription = create(:subscription, subscriber: widget)
    
    visit flyover_subscriptions.subscriptions_path
    expect(page).to have_content "Update Card"
    expect(page).to have_content "List Charges"
    expect(page).to have_content "Cancel Subscription"
  end

  context "with a valid card number" do
    it "creates a subscription"
  end
end