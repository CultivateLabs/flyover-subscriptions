Rails.application.routes.draw do
  mount FlyoverSubscriptions::Engine => "/flyover_subscriptions"
end