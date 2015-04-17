module FlyoverSubscriptions
  class Plan < ActiveRecord::Base
    validates_presence_of :name, :price_in_cents, :interval, :stripe_id
  end
end
