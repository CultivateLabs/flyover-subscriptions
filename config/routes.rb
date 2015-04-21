FlyoverSubscriptions::Engine.routes.draw do
  resources :subscriptions, only: [:index, :create, :update, :destroy]
end
