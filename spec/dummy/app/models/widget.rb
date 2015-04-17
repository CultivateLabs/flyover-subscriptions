class Widget < ActiveRecord::Base
  acts_as_subscriber

  def email
    "user@example.com"
  end
end