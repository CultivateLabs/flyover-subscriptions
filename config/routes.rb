FlyoverSubscriptions::Engine.routes.draw do
  resources :subscriptions
  resources :charges, only: :index
end
