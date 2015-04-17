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

  context "with a valid card number" do
    it "creates a subscription"
  end
end