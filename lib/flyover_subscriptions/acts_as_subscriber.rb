module FlyoverSubscriptions
  module ActsAsSubscriber
    def acts_as_subscriber(options = {})
      include FlyoverSubscriptions::ActsAsSubscriber::InstanceMethods
      has_one :subscription, as: :subscriber, class_name: "FlyoverSubscriptions::Subscription", dependent: :destroy
      before_destroy :cancel_subscription
      accepts_nested_attributes_for :subscription
    end

    module InstanceMethods
      def has_subscription?
        self.subscription.present?
      end

      def cancel_subscription
        self.subscription.cancel_stripe_subscription
      end

      def flyover_subscription_plan
        nil
      end
    end
  end
end

ActiveRecord::Base.extend FlyoverSubscriptions::ActsAsSubscriber