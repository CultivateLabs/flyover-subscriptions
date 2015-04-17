FactoryGirl.define do
  factory :subscription, class: 'FlyoverSubscriptions::Subscription' do
    association :subscriber, factory: :widget
    stripe_customer_token nil
    plan
  end
end
