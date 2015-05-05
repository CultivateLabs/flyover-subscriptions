class ApplicationMailer < ActionMailer::Base
  default from: FlyoverSubscriptions.notifications_from_email
  layout 'mailer'
end
