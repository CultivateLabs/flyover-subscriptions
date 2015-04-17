Rails.application.routes.draw do
  resources :subscriptions, only: :new
  mount FlyoverSubscriptions::Engine => "/flyover_subscriptions"
end