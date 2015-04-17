require 'rails_helper'

module FlyoverSubscriptions
  RSpec.describe Plan, type: :model do
    it { should validate_presence_of(:name) }
    it { should validate_presence_of(:price_in_cents) }
    it { should validate_presence_of(:stripe_id) }
    it { should validate_presence_of(:interval) }
  end
end
