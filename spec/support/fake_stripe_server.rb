# Mount fake Sinatra Stripe Server to Capybara
#
# Example:
#
#   feature 'Subscribe' do
#     given!(:user) { create(:user) }
#     background { StripeMock.start }
#     after { StripeMock.stop }
#     scenario 'obtain stripe credit card token', :js do
#       server = FakeStripeServer.boot
#       Stripe.api_base = 'http://' + [server.host, server.port].join(':')
#       visit subscription_path(user.subscription)
#       ...
#     end
#
# or you can run the server manually form command line:
#
#   $ ./fake_stripe_server
#
# http://robots.thoughtbot.com/using-capybara-to-test-javascript-that-makes-http
# https://github.com/rebelidealist/stripe-ruby-mock/issues/52
class FakeStripeServer < Sinatra::Base
 
  def self.boot
    instance = new
    Capybara::Server.new(instance).tap { |server| server.boot }
  end
 
  get '/' do
    '<center>' <<
    '<h1>Hello, Fake $tripe Server here ☺</h1>' <<
    '<p><a href="/v1/tokens?card[number]=4242+4242+4242+4242&card[cvc]=123&card[exp_month]=7&card[exp_year]=2021&key=pk_test_3Bd9i4KBm6XZgEw3mjCjbC7K&payment_user_agent=stripe.js%2F0c86740&callback=sjsonp1413830642863&_method=POST">GET /v1/tokens</a></p>' <<
    '</center>'
  end
 
  # POST https://api.stripe.com/v1/tokens?card[number]=4242+4242+4242+4242&card[cvc]=123&card[exp_month]=7&card[exp_year]=2021&key=pk_test_3Bd9i4KBm6XZgEw3mjCjbC7K&payment_user_agent=stripe.js%2F0c86740&callback=sjsonp1413830642863&_method=POST
  post '/v1/tokens' do
    mock_response
  end
 
  # for debug use only
  # GET https://api.stripe.com/v1/tokens?card[number]=4242+4242+4242+4242&card[cvc]=123&card[exp_month]=7&card[exp_year]=2021&key=pk_test_3Bd9i4KBm6XZgEw3mjCjbC7K&payment_user_agent=stripe.js%2F0c86740&callback=sjsonp1413830642863&_method=POST
  get '/v1/tokens' do
    mock_response
  end
 
  def mock_response
    jsonp_callback = params[:callback]
    token = StripeMock.generate_card_token(params[:card])
    response_code = 500
    response = {
      error: {
        message: "This card number looks invalid."
      },
      id: token, # 'tok_4zkgf83otVadp0',
      livemode: false,
      created: Time.new.to_i,
      used: false,
      object: 'token',
      type: 'card',
      card: {
        id: 'card_4zkgMqNbIykebF',
        object: 'card',
        last4: params[:card][:number][-4..-1] || params[:card][:number],
        brand: 'Visa',
        funding: 'credit',
        exp_month: params[:card][:exp_month],
        exp_year: params[:card][:exp_year],
        fingerprint: 'TyO4SWrYg4hk0xNe',
        country: 'US',
        name: nil,
        address_line1: nil,
        address_line2: nil,
        address_city: nil,
        address_state: nil,
        address_zip: nil,
        address_country: nil,
        dynamic_last4: nil,
        customer: nil,
        type: 'Visa'
      }
    }
    "#{jsonp_callback}(#{JSON.generate(response)}, #{response_code})"
  end
end
 
### MAIN ####
 
if File.identical?(__FILE__, $0)
  StripeMock.start
  FakeStripeServer.run!
  StripeMock.stop
end