require "flyover_subscriptions/engine"
require "flyover_subscriptions/acts_as_subscriber"
require "jquery-rails"
require "coffee-rails"
require "sass-rails"
require "bootstrap-sass"
require "font-awesome-sass"
require "simple_form"
require "stripe"
require "stripe_event"

module FlyoverSubscriptions
  mattr_accessor :base_controller
  @@base_controller = "::ApplicationController"

  mattr_accessor :current_subscriber_method
  @@current_subscriber_method = "current_subscriber"

  mattr_accessor :notifications_from_email
  @@notifications_from_email = "noreply@example.com"

  def self.configure(&block)
    yield self
  end

  def self.base_controller
    @@base_controller.constantize
  end
end
