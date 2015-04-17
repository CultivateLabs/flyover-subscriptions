require "flyover_subscriptions/engine"
require "flyover_subscriptions/acts_as_subscriber"
require "jquery-rails"
require "coffee-rails"
require "stripe"

module FlyoverSubscriptions
  mattr_accessor :base_controller
  @@base_controller = "::ApplicationController"

  mattr_accessor :current_subscriber_method
  @@current_subscriber_method = "current_subscriber"

  def self.configure(&block)
    yield self
  end

  def self.base_controller
    @@base_controller.constantize
  end
end
