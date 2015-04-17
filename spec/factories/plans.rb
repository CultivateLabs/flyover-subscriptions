FactoryGirl.define do
  factory :plan, :class => 'FlyoverSubscriptions::Plan' do
    price_in_cents 14900
    stripe_id "MemberCampus"
    interval "year"
    name "Member Campus"
  end
end