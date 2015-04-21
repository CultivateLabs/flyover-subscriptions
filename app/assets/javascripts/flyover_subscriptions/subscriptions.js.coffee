$ ->
  if $(".stripe-form").length > 0
    Stripe.setPublishableKey($('meta[name="stripe-key"]').attr('content'))
    subscription.setupForm()

subscription =
  setupForm: ->
    $('.stripe-form').submit ->
      $('.stripe-form input[type=submit]').attr('disabled', true)
      if $('#card_number').length
        subscription.processCard()
        false
      else
        true
  
  processCard: ->
    regex = new RegExp(/\d\d\/\d\d/)
    if regex.test($("#card_expiration").val())
      date = $("#card_expiration").val().split("/")
      month = date[0]
      year = parseInt(date[1]) + 2000
    else
      month = (new Date).getMonth()
      year = (new Date).getFullYear()
    card =
      number: $('#card_number').val()
      cvc: $('#card_code').val()
      expMonth: month
      expYear: year
    Stripe.createToken(card, subscription.handleStripeResponse)
  
  handleStripeResponse: (status, response) ->
    if status == 200
      $('#stripe-card-token').val(response.id)
      $('.stripe-form')[0].submit()
    else
      $('#stripe_error').html("<div class='alert alert-danger'>#{response.error.message}</div>").show()
      $('.stripe-form input[type=submit]').attr('disabled', false)