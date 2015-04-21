$:.push File.expand_path("../lib", __FILE__)

# Maintain your gem's version:
require "flyover_subscriptions/version"

# Describe your gem and declare its dependencies:
Gem::Specification.new do |s|
  s.name        = "flyover_subscriptions"
  s.version     = FlyoverSubscriptions::VERSION
  s.authors     = ["David Van Der Beek"]
  s.email       = ["earlynovrock@gmail.com"]
  s.homepage    = "http://www.github.com/flyoverworks/apex_campus"
  s.summary     = "Stripe subscription payments for ApexCampus"
  s.description = "Stripe subscription payments for ApexCampus"
  s.license     = "MIT"

  s.files = Dir["{app,config,db,lib}/**/*", "MIT-LICENSE", "Rakefile", "README.rdoc"]

  s.add_dependency "rails", "~> 4.0"
  s.add_dependency "coffee-rails"
  s.add_dependency "jquery-rails"
  s.add_dependency "bootstrap-sass"
  s.add_dependency "font-awesome-sass"
  s.add_dependency "simple_form"
  s.add_dependency "stripe"

  s.add_development_dependency "pg"
  s.add_development_dependency "rspec-rails"
  s.add_development_dependency "factory_girl_rails"
  s.add_development_dependency "capybara"
  s.add_development_dependency "poltergeist", "~>1.5"
  s.add_development_dependency "pry-nav"
  s.add_development_dependency "pry-stack_explorer"
  s.add_development_dependency "database_cleaner", '1.3.0'
  s.add_development_dependency "guard-rspec"
  s.add_development_dependency "shoulda-matchers", '~>2.8'
  s.add_development_dependency "dotenv-rails"
  s.add_development_dependency "sinatra"
  s.add_development_dependency 'stripe-ruby-mock', '~> 2.1.0'
end
