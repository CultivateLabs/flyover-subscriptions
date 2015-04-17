# Flyover Subscriptions

## Setup

### Environment Variables
You must set `ENV["STRIPE_SECRET"]` and `ENV["STRIPE_PUBLIC_KEY"]` with your API Secret and Publishable Keys so the gem can communicate with Stripe

### Models
FlyoverSubscriptions has two models, Subscription and Plan. You can run `rake db:migrate` to install the migrations. A subscription needs to belong to a subscriber, which is a model in your host app. To designate a model as a subscriber (maybe a User, Company, or Site) just add `acts_as_subscriber` to the model

```
class User
  acts_as_subscriber
end
```

### Nested form fields
Once you have added acts_as_subscriber, the subscriber will accept nested attributes for the subscription and you can use the form fields partial inside the form for your subscriber model as follows: 

```
= simple_form_for @subscriber do |f|
  = f.simple_fields_for :subscription do |sf|
    = render "subscription_fields", f: sf
```

Remember to build a subscription model for the subscriber in the #new action of your controller and add `subscription_attributes: [:id, :stripe_card_token]` to permitted params.

### Stripe JS
You also need to add the js necessary for Stripe to work. In your application.js, add `//= require flyover_subscriptions` and inside your `<head>` tag, add `<%= render 'stripe_js' %>`. Then add `class="stripe-form"` to any forms that have the subscription fields.

## Configuration Settings
Customize the following settings in an initializer:

```
FlyoverSubscriptions.configure do |config|
  config.base_controller = "::ApplicationController"
  config.current_subscriber_method = "current_subscriber"
end
```

This project rocks and uses MIT-LICENSE.
