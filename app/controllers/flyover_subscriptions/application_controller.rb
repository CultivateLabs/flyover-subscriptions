module FlyoverSubscriptions
  class ApplicationController < FlyoverSubscriptions.base_controller
    def current_widget
      Widget.first
    end
    helper_method :current_widget
  end
end
