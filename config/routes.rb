FlyoverSubscriptions::Engine.routes.draw do
  resources :subscriptions, only: [:index, :create, :update, :destroy]
  mount StripeEvent::Engine, at: '/stripe/events'
end
