RSpec.configure do |config|
  config.before(:each) do
    @customer = double(id: "token_123")
    allow(Stripe::Customer).to receive(:create).and_return(@customer)
    allow(Stripe::Customer).to receive(:retrieve).and_return(@customer)
    cards_double = double()
    allow(@customer).to receive(:sources).and_return(cards_double)
    allow(@customer).to receive(:default_source)
    allow(@customer).to receive(:card=).and_return(true)
    allow(@customer).to receive(:charges).and_return(double(data: []))
    allow(cards_double).to receive(:retrieve).and_return(double(last4: "1234"))
  end
end