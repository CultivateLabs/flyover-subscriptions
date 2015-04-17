(function() {
  var exports, hasWarn, iframeBaseUrl, isSafeStripeDomain, key, scripts, stripejsBaseUrl, _i, _len,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  stripejsBaseUrl = 'https://js.stripe.com';

  iframeBaseUrl = 'https://js.stripe.com';

  isSafeStripeDomain = /stripe\.com$/.test(typeof window !== "undefined" && window !== null ? window.location.host : void 0) ? true : false;

  hasWarn = 'console' in window && 'warn' in window.console;

  if (!isSafeStripeDomain && 'querySelectorAll' in document && hasWarn && !false) {
    scripts = document.querySelectorAll('script[src^="' + stripejsBaseUrl + '"]');
    if (!scripts.length) {
      console.warn('It looks like Stripe.js is not being loaded from https://js.stripe.com. Stripe does not support serving Stripe.js from your own domain.');
    }
  }

  if (this.Stripe) {
    if (hasWarn && !this.Stripe.isDoubleLoaded && !this.Stripe.earlyError) {
      console.warn('It looks like Stripe.js was loaded more than one time. Please only load it once per page.');
    }
    this.Stripe.isDoubleLoaded = true;
    return;
  }

  this.Stripe = (function() {
    function Stripe() {}

    Stripe.version = 2;

    Stripe.endpoint = 'https://api.stripe.com/v1';

    Stripe.setPublishableKey = function(key) {
      Stripe.key = key;
      return Stripe.utils.validateProtocol(Stripe.key);
    };

    Stripe.trackPerf = false;

    Stripe._isChannel = (typeof window !== "undefined" && window !== null ? window.location.hash : void 0) === '#__stripe_transport__' ? true : false;

    Stripe._isSafeStripeDomain = isSafeStripeDomain;

    Stripe._iframeOnAmount = 1;

    Stripe._isSafeDomain = (function() {
      if (window.location.hash === '#__forcedss3__') {
        return false;
      }
      if (Stripe._isSafeStripeDomain || window.StripeTemporaryNoDSS3) {
        return true;
      }
      return Stripe._iframeOnAmount < Math.random();
    })();

    Stripe._finalTransport = (typeof window !== "undefined" && window !== null) && 'XMLHttpRequest' in window && 'withCredentials' in new XMLHttpRequest() ? 'cors' : 'jsonp';

    Stripe._transport = Stripe._isChannel || Stripe._isSafeDomain ? Stripe._finalTransport : 'iframe';

    Stripe._fallBackToOldStripeJsTechniques = function() {
      this._transport = 'jsonp';
      this._finalTransport = 'jsonp';
      return this._isSafeDomain = 'true';
    };

    Stripe._iframeRequestQueue = [];

    Stripe._iframePendingRequests = {};

    Stripe._iframeChannelStatus = 'pending';

    Stripe._iframeChannelComplete = function(success) {
      var opts, queue, _i, _len;
      this._iframeChannelStatus = success ? 'success' : 'failure';
      if (this._iframeChannelStatus === 'failure') {
        this._fallBackToOldStripeJsTechniques();
      }
      queue = this._iframeRequestQueue;
      delete this._iframeRequestQueue;
      this._iframeRequestQueue = [];
      for (_i = 0, _len = queue.length; _i < _len; _i++) {
        opts = queue[_i];
        this.request(opts, true);
      }
      this._iframeChannelComplete = function() {
        return Stripe.reportError('CompleteDuplicationError');
      };
    };

    Stripe.request = function(options, _replay) {
      if (this.trackPerf && options.tokenType) {
        return this._instrumentedRequest(options, _replay);
      } else {
        return this._rawRequest(options, _replay);
      }
    };

    Stripe._rawRequest = function(options, _replay) {
      var e, isPCIRequest, _ref;
      isPCIRequest = options.method === 'POST' && ((_ref = options.data) != null ? _ref.card : void 0);
      if (!_replay) {
        if (options.data.payment_user_agent) {
          if (!this._isChannel) {
            options.data.payment_user_agent = "" + options.data.payment_user_agent + " (" + Stripe.stripejs_ua + ")";
          }
        } else {
          options.data.payment_user_agent = Stripe.stripejs_ua;
        }
      }
      if (this._transport === 'iframe') {
        if (isPCIRequest) {
          if (this._iframeChannelStatus === 'pending') {
            return this._iframeRequestQueue.push(options);
          } else if (this._iframeChannelStatus === 'failure') {
            return this.ajaxJSONP(options);
          } else {
            return this.iframe(options);
          }
        } else if (this._finalTransport === 'cors') {
          try {
            return this.xhr(options);
          } catch (_error) {
            e = _error;
            this._transport = 'jsonp';
            return this.request(options, true);
          }
        }
        return this.ajaxJSONP(options);
      } else if (this._transport === 'cors') {
        try {
          return this.xhr(options);
        } catch (_error) {
          e = _error;
          Stripe.reportError('XhrThrewError');
          this._transport = 'jsonp';
          return this.request(options, true);
        }
      }
      return this.ajaxJSONP(options);
    };

    Stripe.reportError = function(type, timing) {
      var timestamp;
      if ('console' in window && 'warn' in window.console && false) {
        console.warn('Error Reported: ' + type + (timing ? ' ' + timing : ''));
      }
      timestamp = Math.round(new Date().getTime() / 1000);
      return (new Image).src = "https://q.stripe.com?event=stripejs-error&type=" + (encodeURIComponent(type)) + (timing ? '&timing=' + timing : '') + "&key=" + Stripe.key + "&timestamp=" + timestamp + "&payment_user_agent=" + (encodeURIComponent(Stripe.stripejs_ua));
    };

    Stripe._instrumentedRequest = function(options, _replay) {
      var startTime, _logRUM;
      startTime = (new Date).getTime();
      _logRUM = (function(_this) {
        return function(xhr, status) {
          var endTime, resourceTiming, rumData, tokenType, _ref;
          tokenType = (_ref = options.tokenType) != null ? _ref : 'unknown';
          endTime = (new Date).getTime();
          resourceTiming = _this._getResourceTiming(xhr != null ? xhr.responseURL : void 0);
          rumData = {
            event: "rum.stripejs",
            tokenType: tokenType,
            url: options.url,
            status: status,
            start: startTime,
            end: endTime,
            resourceTiming: resourceTiming
          };
          return Stripe.logRUM(rumData);
        };
      })(this);
      options.success = (function(success) {
        return function(body, status, xhr) {
          _logRUM(xhr, status);
          return success.apply(this, arguments);
        };
      })(options.success);
      options.complete = (function(complete) {
        return function(type, xhr, options) {
          if (type !== 'success') {
            _logRUM(xhr, type);
          }
          return complete.apply(this, arguments);
        };
      })(options.complete);
      return this._rawRequest(options, _replay);
    };

    Stripe._getResourceTiming = function(url) {
      var timingEntries;
      timingEntries = typeof performance !== "undefined" && performance !== null ? typeof performance.getEntriesByName === "function" ? performance.getEntriesByName(url) : void 0 : void 0;
      switch (false) {
        case (timingEntries != null ? timingEntries.length : void 0) !== 1:
          return this._sanitizeResourceTiming(timingEntries[0]);
        case (timingEntries != null ? timingEntries.length : void 0) !== 0:
          return {
            errorMsg: 'No resource timing entries found'
          };
        case (timingEntries != null ? timingEntries.length : void 0) == null:
          return {
            errorMsg: 'More than one resource timing entry'
          };
        default:
          return null;
      }
    };

    Stripe._resourceTimingWhitelist = ['connectEnd', 'connectStart', 'domainLookupEnd', 'domainLookupStart', 'duration', 'fetchStart', 'redirectEnd', 'redirectStart', 'requestStart', 'responseEnd', 'responseStart', 'secureConnectionStart', 'startTime'];

    Stripe._sanitizeResourceTiming = function(entry) {
      var key, sanitizedEntry, _i, _len, _ref;
      sanitizedEntry = {};
      _ref = this._resourceTimingWhitelist;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        key = _ref[_i];
        if (entry[key]) {
          sanitizedEntry[key] = entry[key];
        }
      }
      return sanitizedEntry;
    };

    Stripe.logRUM = function(data) {
      return (new Image).src = "https://q.stripe.com/?" + (Stripe.utils.serialize(data));
    };

    Stripe.complete = function(callback, errorMessage) {
      return function(type, xhr, options) {
        if (type !== 'success') {
          Stripe.reportError('Complete500-' + type);
          return typeof callback === "function" ? callback(500, {
            error: {
              code: type,
              type: type,
              message: errorMessage
            }
          }) : void 0;
        }
      };
    };

    Stripe._iframeBaseUrl = iframeBaseUrl;

    Stripe._stripejsBaseUrl = stripejsBaseUrl;

    Stripe._relayResponse = function(id, code, resp) {
      return Stripe._socket.postMessage(Stripe.JSON.stringify({
        code: code,
        resp: resp,
        requestId: id
      }));
    };

    Stripe._callCount = 0;

    Stripe._callCache = {};

    Stripe._receiveChannelRelay = function(msg, origin) {
      var e, resp, strippedFrameUrl, strippedOriginUrl;
      strippedFrameUrl = Stripe._iframeBaseUrl.replace(/^https?:\/\//, '').replace(/\/.*$/, '');
      strippedOriginUrl = origin.replace(/^https?:\/\//, '').replace(/\/.*$/, '');
      if (strippedOriginUrl === strippedFrameUrl) {
        if (typeof msg === 'string') {
          try {
            resp = Stripe.JSON.parse(msg);
          } catch (_error) {
            e = _error;
            Stripe.reportError('InvalidJSON-ChannelRelay');
            throw new Error('Stripe.js received invalid JSON');
          }
          if (typeof Stripe._callCache[resp.requestId] === 'function') {
            Stripe._callCache[resp.requestId](resp.resp, resp.code);
            return delete Stripe._callCache[resp.requestId];
          }
        }
      }
    };

    Stripe._channelListener = function(msg, origin) {
      var card, e, req;
      if (typeof msg === 'string') {
        try {
          req = Stripe.JSON.parse(msg);
        } catch (_error) {
          e = _error;
          Stripe.reportError('InvalidJSON-ChannelListener');
          throw new Error('Stripe.js received invalid JSON');
        }
        card = req.data.card;
        delete req.data.card;
        if (card) {
          Stripe.setPublishableKey(req.data.key);
          if (req.endpoint != null) {
            Stripe.endpoint = req.endpoint;
          }
          if (req.trackPerf != null) {
            Stripe.trackPerf = req.trackPerf;
          }
          return Stripe.card.createToken(card, req.data, function(code, resp) {
            return Stripe._relayResponse(req.requestId, code, resp);
          });
        } else {
          Stripe.reportError('InvalidChannelUse-NonCard');
          throw new Error('Stripe.js iframe transport used for non-card request');
        }
      }
    };

    return Stripe;

  })();

  this.Stripe.token = (function() {
    function token() {}

    token.validate = function(data, name) {
      if (!data) {
        throw name + ' required';
      }
      if (typeof data !== 'object') {
        throw name + ' invalid';
      }
    };

    token.formatData = function(data, attrs) {
      if (Stripe.utils.isElement(data)) {
        data = Stripe.utils.paramsFromForm(data, attrs);
      }
      Stripe.utils.underscoreKeys(data);
      return data;
    };

    token.create = function(params, callback) {
      var tokenName;
      params.key || (params.key = Stripe.key || Stripe.publishableKey);
      Stripe.utils.validateKey(params.key);
      tokenName = (function() {
        switch (false) {
          case params.card == null:
            return 'card';
          case params.bank_account == null:
            return 'bank_account';
          default:
            return 'unknown';
        }
      })();
      return Stripe.request({
        url: "" + Stripe.endpoint + "/tokens",
        data: params,
        method: 'POST',
        success: function(body, status) {
          return typeof callback === "function" ? callback(status, body) : void 0;
        },
        complete: Stripe.complete(callback, "A network error has occurred, and you have not been charged. Please try again."),
        timeout: 40000,
        tokenType: tokenName
      });
    };

    token.get = function(token, callback) {
      if (!token) {
        throw new Error('token required');
      }
      Stripe.utils.validateKey(Stripe.key);
      return Stripe.request({
        url: "" + Stripe.endpoint + "/tokens/" + token,
        data: {
          key: Stripe.key
        },
        success: function(body, status) {
          return typeof callback === "function" ? callback(status, body) : void 0;
        },
        complete: Stripe.complete(callback, "A network error has occurred loading data from Stripe. Please try again."),
        timeout: 40000
      });
    };

    return token;

  })();

  this.Stripe.card = (function(_super) {
    __extends(card, _super);

    function card() {
      return card.__super__.constructor.apply(this, arguments);
    }

    card.tokenName = 'card';

    card.whitelistedAttrs = ['number', 'cvc', 'exp_month', 'exp_year', 'name', 'address_line1', 'address_line2', 'address_city', 'address_state', 'address_zip', 'address_country'];

    card.createToken = function(data, params, callback) {
      var amount;
      if (params == null) {
        params = {};
      }
      Stripe.token.validate(data, 'card');
      if (typeof params === 'function') {
        callback = params;
        params = {};
      } else if (typeof params !== 'object') {
        amount = parseInt(params, 10);
        params = {};
        if (amount > 0) {
          params.amount = amount;
        }
      }
      params[card.tokenName] = Stripe.token.formatData(data, card.whitelistedAttrs);
      return Stripe.token.create(params, callback);
    };

    card.getToken = function(token, callback) {
      return Stripe.token.get(token, callback);
    };

    card.validateCardNumber = function(num) {
      num = (num + '').replace(/\s+|-/g, '');
      return num.length >= 10 && num.length <= 16 && card.luhnCheck(num);
    };

    card.validateCVC = function(num) {
      num = Stripe.utils.trim(num);
      return /^\d+$/.test(num) && num.length >= 3 && num.length <= 4;
    };

    card.validateExpiry = function(month, year) {
      var currentTime, expiry;
      month = Stripe.utils.trim(month);
      year = Stripe.utils.trim(year);
      if (!/^\d+$/.test(month)) {
        return false;
      }
      if (!/^\d+$/.test(year)) {
        return false;
      }
      if (!((1 <= month && month <= 12))) {
        return false;
      }
      if (year.length === 2) {
        if (year < 70) {
          year = "20" + year;
        } else {
          year = "19" + year;
        }
      }
      if (year.length !== 4) {
        return false;
      }
      expiry = new Date(year, month);
      currentTime = new Date;
      expiry.setMonth(expiry.getMonth() - 1);
      expiry.setMonth(expiry.getMonth() + 1, 1);
      return expiry > currentTime;
    };

    card.luhnCheck = function(num) {
      var digit, digits, odd, sum, _i, _len;
      odd = true;
      sum = 0;
      digits = (num + '').split('').reverse();
      for (_i = 0, _len = digits.length; _i < _len; _i++) {
        digit = digits[_i];
        digit = parseInt(digit, 10);
        if ((odd = !odd)) {
          digit *= 2;
        }
        if (digit > 9) {
          digit -= 9;
        }
        sum += digit;
      }
      return sum % 10 === 0;
    };

    card.cardType = function(num) {
      return card.cardTypes[num.slice(0, 2)] || 'Unknown';
    };

    card.cardBrand = function(num) {
      return card.cardType(num);
    };

    card.cardTypes = (function() {
      var num, types, _i, _j;
      types = {};
      for (num = _i = 40; _i <= 49; num = ++_i) {
        types[num] = 'Visa';
      }
      for (num = _j = 50; _j <= 59; num = ++_j) {
        types[num] = 'MasterCard';
      }
      types[34] = types[37] = 'American Express';
      types[60] = types[62] = types[64] = types[65] = 'Discover';
      types[35] = 'JCB';
      types[30] = types[36] = types[38] = types[39] = 'Diners Club';
      return types;
    })();

    return card;

  })(this.Stripe.token);

  this.Stripe.bankAccount = (function(_super) {
    __extends(bankAccount, _super);

    function bankAccount() {
      return bankAccount.__super__.constructor.apply(this, arguments);
    }

    bankAccount.tokenName = 'bank_account';

    bankAccount.whitelistedAttrs = ['country', 'currency', 'routing_number', 'account_number'];

    bankAccount.createToken = function(data, params, callback) {
      if (params == null) {
        params = {};
      }
      Stripe.token.validate(data, 'bank account');
      if (typeof params === 'function') {
        callback = params;
        params = {};
      }
      params[bankAccount.tokenName] = Stripe.token.formatData(data, bankAccount.whitelistedAttrs);
      return Stripe.token.create(params, callback);
    };

    bankAccount.getToken = function(token, callback) {
      return Stripe.token.get(token, callback);
    };

    bankAccount.validateRoutingNumber = function(num, country) {
      num = Stripe.utils.trim(num);
      switch (country) {
        case 'US':
          return /^\d+$/.test(num) && num.length === 9 && bankAccount.routingChecksum(num);
        case 'CA':
          return /\d{5}\-\d{3}/.test(num) && num.length === 9;
        default:
          return true;
      }
    };

    bankAccount.validateAccountNumber = function(num, country) {
      num = Stripe.utils.trim(num);
      switch (country) {
        case 'US':
          return /^\d+$/.test(num) && num.length >= 1 && num.length <= 17;
        default:
          return true;
      }
    };

    bankAccount.routingChecksum = function(num) {
      var digits, index, sum, _i, _len, _ref;
      sum = 0;
      digits = (num + '').split('');
      _ref = [0, 3, 6];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        index = _ref[_i];
        sum += parseInt(digits[index]) * 3;
        sum += parseInt(digits[index + 1]) * 7;
        sum += parseInt(digits[index + 2]);
      }
      return sum !== 0 && sum % 10 === 0;
    };

    return bankAccount;

  })(this.Stripe.token);

  this.Stripe.bitcoinReceiver = (function() {
    function bitcoinReceiver() {}

    bitcoinReceiver._whitelistedAttrs = ['amount', 'currency', 'email', 'description'];

    bitcoinReceiver.createReceiver = function(data, callback) {
      var params;
      Stripe.token.validate(data, 'bitcoin_receiver data');
      params = Stripe.token.formatData(data, this._whitelistedAttrs);
      params.key = Stripe.key || Stripe.publishableKey;
      Stripe.utils.validateKey(params.key);
      return Stripe.request({
        url: "" + Stripe.endpoint + "/bitcoin/receivers",
        data: params,
        method: 'POST',
        success: function(body, status) {
          return typeof callback === "function" ? callback(status, body) : void 0;
        },
        complete: Stripe.complete(callback, "A network error has occurred while creating a Bitcoin address. Please try again."),
        timeout: 40000
      });
    };

    bitcoinReceiver.getReceiver = function(id, callback) {
      var key;
      if (!id) {
        throw new Error('receiver id required');
      }
      key = Stripe.key || Stripe.publishableKey;
      Stripe.utils.validateKey(key);
      return Stripe.request({
        url: "" + Stripe.endpoint + "/bitcoin/receivers/" + id,
        data: {
          key: key
        },
        success: function(body, status) {
          return typeof callback === "function" ? callback(status, body) : void 0;
        },
        complete: Stripe.complete(callback, "A network error has occurred loading data from Stripe. Please try again."),
        timeout: 40000
      });
    };

    bitcoinReceiver._activeReceiverPolls = {};

    bitcoinReceiver._clearReceiverPoll = function(receiverId) {
      return delete bitcoinReceiver._activeReceiverPolls[receiverId];
    };

    bitcoinReceiver._pollInterval = 1500;

    bitcoinReceiver.pollReceiver = function(receiverId, callback) {
      if (this._activeReceiverPolls[receiverId] != null) {
        throw new Error("You are already polling receiver " + receiverId + ". Please cancel that poll before polling it again.");
      }
      this._activeReceiverPolls[receiverId] = {};
      return this._pollReceiver(receiverId, callback);
    };

    bitcoinReceiver._pollReceiver = function(receiverId, callback) {
      bitcoinReceiver.getReceiver(receiverId, function(status, body) {
        var pollInterval, timeoutId;
        if (bitcoinReceiver._activeReceiverPolls[receiverId] == null) {
          return;
        }
        if (status === 200 && body.filled) {
          bitcoinReceiver._clearReceiverPoll(receiverId);
          return typeof callback === "function" ? callback(status, body) : void 0;
        } else if (status >= 400 && status < 500) {
          bitcoinReceiver._clearReceiverPoll(receiverId);
          return typeof callback === "function" ? callback(status, body) : void 0;
        } else {
          pollInterval = status === 500 ? 5000 : bitcoinReceiver._pollInterval;
          timeoutId = setTimeout(function() {
            return bitcoinReceiver._pollReceiver(receiverId, callback);
          }, pollInterval);
          return bitcoinReceiver._activeReceiverPolls[receiverId]['timeoutId'] = timeoutId;
        }
      });
    };

    bitcoinReceiver.cancelReceiverPoll = function(receiverId) {
      var activeReceiver;
      activeReceiver = bitcoinReceiver._activeReceiverPolls[receiverId];
      if (activeReceiver == null) {
        throw new Error("You are not polling receiver " + receiverId + ".");
      }
      if (activeReceiver['timeoutId'] != null) {
        clearTimeout(activeReceiver['timeoutId']);
      }
      bitcoinReceiver._clearReceiverPoll(receiverId);
    };

    return bitcoinReceiver;

  })();

  exports = ['createToken', 'getToken', 'cardType', 'validateExpiry', 'validateCVC', 'validateCardNumber'];

  for (_i = 0, _len = exports.length; _i < _len; _i++) {
    key = exports[_i];
    this.Stripe[key] = this.Stripe.card[key];
  }

  this.Stripe.stripejs_ua = "stripe.js/bebcbe6";

  if (typeof module !== "undefined" && module !== null) {
    module.exports = this.Stripe;
  }

  if (typeof define === "function") {
    define('stripe', [], (function(_this) {
      return function() {
        return _this.Stripe;
      };
    })(this));
  }

}).call(this);

(function() {
  if (this.Stripe.isDoubleLoaded) {
    return;
  }

  /*! JSON v3.3.2 | http://bestiejs.github.io/json3 | Copyright 2012-2014, Kit Cambridge | http://kit.mit-license.org */
/* This file has been modified by Stripe (specifically alexsexton) to remove lots of environment magic. */
;(function (window) {
  // A set of types used to distinguish objects from primitives.
  var objectTypes = {
    "function": true,
    "object": true
  };

  var root = this;

  // Public: Initializes JSON 3 using the given context object, attaching the
  // stringify and parse functions to the specified exports object.
  function runInContext(context, exports) {
    context || (context = root["Object"]());
    exports || (exports = root["Object"]());

    // Native constructor aliases.
    var Number = context["Number"] || root["Number"],
        String = context["String"] || root["String"],
        Object = context["Object"] || root["Object"],
        Date = context["Date"] || root["Date"],
        SyntaxError = context["SyntaxError"] || root["SyntaxError"],
        TypeError = context["TypeError"] || root["TypeError"],
        Math = context["Math"] || root["Math"],
        nativeJSON = context["JSON"] || root["JSON"];

    // Delegate to the native stringify and parse implementations.
    if (typeof nativeJSON == "object" && nativeJSON) {
      exports.stringify = nativeJSON.stringify;
      exports.parse = nativeJSON.parse;
    }

    // Convenience aliases.
    var objectProto = Object.prototype,
        getClass = objectProto.toString,
        isProperty, forEach, undef;

    // Test the Date#getUTC* methods. Based on work by @Yaffle.
    var isExtended = new Date(-3509827334573292);
    try {
      // The getUTCFullYear, Month, and Date methods return nonsensical
      // results for certain dates in Opera >= 10.53.
      isExtended = isExtended.getUTCFullYear() == -109252 && isExtended.getUTCMonth() === 0 && isExtended.getUTCDate() === 1 &&
        // Safari < 2.0.2 stores the internal millisecond time value correctly,
        // but clips the values returned by the date methods to the range of
        // signed 32-bit integers ([-2 ** 31, 2 ** 31 - 1]).
        isExtended.getUTCHours() == 10 && isExtended.getUTCMinutes() == 37 && isExtended.getUTCSeconds() == 6 && isExtended.getUTCMilliseconds() == 708;
    } catch (exception) {}

    // Internal: Determines whether the native JSON.stringify and parse
    // implementations are spec-compliant. Based on work by Ken Snyder.
    function has(name) {
      if (has[name] !== undef) {
        // Return cached feature test result.
        return has[name];
      }
      var isSupported;
      if (name == "bug-string-char-index") {
        // IE <= 7 doesn't support accessing string characters using square
        // bracket notation. IE 8 only supports this for primitives.
        isSupported = "a"[0] != "a";
      } else if (name == "json") {
        // Indicates whether both JSON.stringify and JSON.parse are
        // supported.
        isSupported = has("json-stringify") && has("json-parse");
      } else {
        var value, serialized = '{"a":[1,true,false,null,"\\u0000\\b\\n\\f\\r\\t"]}';
        // Test JSON.stringify.
        if (name == "json-stringify") {
          var stringify = exports.stringify, stringifySupported = typeof stringify == "function" && isExtended;
          if (stringifySupported) {
            // A test function object with a custom toJSON method.
            (value = function () {
              return 1;
            }).toJSON = value;
            try {
              stringifySupported =
                // Firefox 3.1b1 and b2 serialize string, number, and boolean
                // primitives as object literals.
                stringify(0) === "0" &&
                // FF 3.1b1, b2, and JSON 2 serialize wrapped primitives as object
                // literals.
                stringify(new Number()) === "0" &&
                stringify(new String()) == '""' &&
                // FF 3.1b1, 2 throw an error if the value is null, undefined, or
                // does not define a canonical JSON representation (this applies to
                // objects with toJSON properties as well, *unless* they are nested
                // within an object or array).
                stringify(getClass) === undef &&
                // IE 8 serializes undefined as "undefined". Safari <= 5.1.7 and
                // FF 3.1b3 pass this test.
                stringify(undef) === undef &&
                // Safari <= 5.1.7 and FF 3.1b3 throw Errors and TypeErrors,
                // respectively, if the value is omitted entirely.
                stringify() === undef &&
                // FF 3.1b1, 2 throw an error if the given value is not a number,
                // string, array, object, Boolean, or null literal. This applies to
                // objects with custom toJSON methods as well, unless they are nested
                // inside object or array literals. YUI 3.0.0b1 ignores custom toJSON
                // methods entirely.
                stringify(value) === "1" &&
                stringify([value]) == "[1]" &&
                // Prototype <= 1.6.1 serializes [undefined] as "[]" instead of
                // "[null]".
                stringify([undef]) == "[null]" &&
                // YUI 3.0.0b1 fails to serialize null literals.
                stringify(null) == "null" &&
                // FF 3.1b1, 2 halts serialization if an array contains a function:
                // [1, true, getClass, 1] serializes as "[1,true,],". FF 3.1b3
                // elides non-JSON values from objects and arrays, unless they
                // define custom toJSON methods.
                stringify([undef, getClass, null]) == "[null,null,null]" &&
                // Simple serialization test. FF 3.1b1 uses Unicode escape sequences
                // where character escape codes are expected (e.g., \b => \u0008).
                stringify({ "a": [value, true, false, null, "\x00\b\n\f\r\t"] }) == serialized &&
                // FF 3.1b1 and b2 ignore the filter and width arguments.
                stringify(null, value) === "1" &&
                stringify([1, 2], null, 1) == "[\n 1,\n 2\n]" &&
                // JSON 2, Prototype <= 1.7, and older WebKit builds incorrectly
                // serialize extended years.
                stringify(new Date(-8.64e15)) == '"-271821-04-20T00:00:00.000Z"' &&
                // The milliseconds are optional in ES 5, but required in 5.1.
                stringify(new Date(8.64e15)) == '"+275760-09-13T00:00:00.000Z"' &&
                // Firefox <= 11.0 incorrectly serializes years prior to 0 as negative
                // four-digit years instead of six-digit years. Credits: @Yaffle.
                stringify(new Date(-621987552e5)) == '"-000001-01-01T00:00:00.000Z"' &&
                // Safari <= 5.1.5 and Opera >= 10.53 incorrectly serialize millisecond
                // values less than 1000. Credits: @Yaffle.
                stringify(new Date(-1)) == '"1969-12-31T23:59:59.999Z"';
            } catch (exception) {
              stringifySupported = false;
            }
          }
          isSupported = stringifySupported;
        }
        // Test JSON.parse.
        if (name == "json-parse") {
          var parse = exports.parse;
          if (typeof parse == "function") {
            try {
              // FF 3.1b1, b2 will throw an exception if a bare literal is provided.
              // Conforming implementations should also coerce the initial argument to
              // a string prior to parsing.
              if (parse("0") === 0 && !parse(false)) {
                // Simple parsing test.
                value = parse(serialized);
                var parseSupported = value["a"].length == 5 && value["a"][0] === 1;
                if (parseSupported) {
                  try {
                    // Safari <= 5.1.2 and FF 3.1b1 allow unescaped tabs in strings.
                    parseSupported = !parse('"\t"');
                  } catch (exception) {}
                  if (parseSupported) {
                    try {
                      // FF 4.0 and 4.0.1 allow leading + signs and leading
                      // decimal points. FF 4.0, 4.0.1, and IE 9-10 also allow
                      // certain octal literals.
                      parseSupported = parse("01") !== 1;
                    } catch (exception) {}
                  }
                  if (parseSupported) {
                    try {
                      // FF 4.0, 4.0.1, and Rhino 1.7R3-R4 allow trailing decimal
                      // points. These environments, along with FF 3.1b1 and 2,
                      // also allow trailing commas in JSON objects and arrays.
                      parseSupported = parse("1.") !== 1;
                    } catch (exception) {}
                  }
                }
              }
            } catch (exception) {
              parseSupported = false;
            }
          }
          isSupported = parseSupported;
        }
      }
      return has[name] = !!isSupported;
    }

    if (!has("json")) {
      // Common [[Class]] name aliases.
      var functionClass = "[object Function]",
          dateClass = "[object Date]",
          numberClass = "[object Number]",
          stringClass = "[object String]",
          arrayClass = "[object Array]",
          booleanClass = "[object Boolean]";

      // Detect incomplete support for accessing string characters by index.
      var charIndexBuggy = has("bug-string-char-index");

      // Define additional utility methods if the Date methods are buggy.
      if (!isExtended) {
        var floor = Math.floor;
        // A mapping between the months of the year and the number of days between
        // January 1st and the first of the respective month.
        var Months = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
        // Internal: Calculates the number of days between the Unix epoch and the
        // first day of the given month.
        var getDay = function (year, month) {
          return Months[month] + 365 * (year - 1970) + floor((year - 1969 + (month = +(month > 1))) / 4) - floor((year - 1901 + month) / 100) + floor((year - 1601 + month) / 400);
        };
      }

      // Internal: Determines if a property is a direct property of the given
      // object. Delegates to the native Object#hasOwnProperty method.
      if (!(isProperty = objectProto.hasOwnProperty)) {
        isProperty = function (property) {
          var members = {}, constructor;
          if ((members.__proto__ = null, members.__proto__ = {
            // The *proto* property cannot be set multiple times in recent
            // versions of Firefox and SeaMonkey.
            "toString": 1
          }, members).toString != getClass) {
            // Safari <= 2.0.3 doesn't implement Object#hasOwnProperty, but
            // supports the mutable *proto* property.
            isProperty = function (property) {
              // Capture and break the object's prototype chain (see section 8.6.2
              // of the ES 5.1 spec). The parenthesized expression prevents an
              // unsafe transformation by the Closure Compiler.
              var original = this.__proto__, result = property in (this.__proto__ = null, this);
              // Restore the original prototype chain.
              this.__proto__ = original;
              return result;
            };
          } else {
            // Capture a reference to the top-level Object constructor.
            constructor = members.constructor;
            // Use the constructor property to simulate Object#hasOwnProperty in
            // other environments.
            isProperty = function (property) {
              var parent = (this.constructor || constructor).prototype;
              return property in this && !(property in parent && this[property] === parent[property]);
            };
          }
          members = null;
          return isProperty.call(this, property);
        };
      }

      // Internal: Normalizes the for...in iteration algorithm across
      // environments. Each enumerated key is yielded to a callback function.
      forEach = function (object, callback) {
        var size = 0, Properties, members, property;

        // Tests for bugs in the current environment's for...in algorithm. The
        // valueOf property inherits the non-enumerable flag from
        // Object.prototype in older versions of IE, Netscape, and Mozilla.
        (Properties = function () {
          this.valueOf = 0;
        }).prototype.valueOf = 0;

        // Iterate over a new instance of the Properties class.
        members = new Properties();
        for (property in members) {
          // Ignore all properties inherited from Object.prototype.
          if (isProperty.call(members, property)) {
            size++;
          }
        }
        Properties = members = null;

        // Normalize the iteration algorithm.
        if (!size) {
          // A list of non-enumerable properties inherited from Object.prototype.
          members = ["valueOf", "toString", "toLocaleString", "propertyIsEnumerable", "isPrototypeOf", "hasOwnProperty", "constructor"];
          // IE <= 8, Mozilla 1.0, and Netscape 6.2 ignore shadowed non-enumerable
          // properties.
          forEach = function (object, callback) {
            var isFunction = getClass.call(object) == functionClass, property, length;
            var hasProperty = !isFunction && typeof object.constructor != "function" && objectTypes[typeof object.hasOwnProperty] && object.hasOwnProperty || isProperty;
            for (property in object) {
              // Gecko <= 1.0 enumerates the prototype property of functions under
              // certain conditions; IE does not.
              if (!(isFunction && property == "prototype") && hasProperty.call(object, property)) {
                callback(property);
              }
            }
            // Manually invoke the callback for each non-enumerable property.
            for (length = members.length; property = members[--length]; hasProperty.call(object, property) && callback(property));
          };
        } else if (size == 2) {
          // Safari <= 2.0.4 enumerates shadowed properties twice.
          forEach = function (object, callback) {
            // Create a set of iterated properties.
            var members = {}, isFunction = getClass.call(object) == functionClass, property;
            for (property in object) {
              // Store each property name to prevent double enumeration. The
              // prototype property of functions is not enumerated due to cross-
              // environment inconsistencies.
              if (!(isFunction && property == "prototype") && !isProperty.call(members, property) && (members[property] = 1) && isProperty.call(object, property)) {
                callback(property);
              }
            }
          };
        } else {
          // No bugs detected; use the standard for...in algorithm.
          forEach = function (object, callback) {
            var isFunction = getClass.call(object) == functionClass, property, isConstructor;
            for (property in object) {
              if (!(isFunction && property == "prototype") && isProperty.call(object, property) && !(isConstructor = property === "constructor")) {
                callback(property);
              }
            }
            // Manually invoke the callback for the constructor property due to
            // cross-environment inconsistencies.
            if (isConstructor || isProperty.call(object, (property = "constructor"))) {
              callback(property);
            }
          };
        }
        return forEach(object, callback);
      };

      // Public: Serializes a JavaScript value as a JSON string. The optional
      // filter argument may specify either a function that alters how object and
      // array members are serialized, or an array of strings and numbers that
      // indicates which properties should be serialized. The optional width
      // argument may be either a string or number that specifies the indentation
      // level of the output.
      if (!has("json-stringify")) {
        // Internal: A map of control characters and their escaped equivalents.
        var Escapes = {
          92: "\\\\",
          34: '\\"',
          8: "\\b",
          12: "\\f",
          10: "\\n",
          13: "\\r",
          9: "\\t"
        };

        // Internal: Converts value into a zero-padded string such that its
        // length is at least equal to width. The width must be <= 6.
        var leadingZeroes = "000000";
        var toPaddedString = function (width, value) {
          // The || 0 expression is necessary to work around a bug in
          // Opera <= 7.54u2 where 0 == -0, but String(-0) !== "0".
          return (leadingZeroes + (value || 0)).slice(-width);
        };

        // Internal: Double-quotes a string value, replacing all ASCII control
        // characters (characters with code unit values between 0 and 31) with
        // their escaped equivalents. This is an implementation of the
        // Quote(value) operation defined in ES 5.1 section 15.12.3.
        var unicodePrefix = "\\u00";
        var quote = function (value) {
          var result = '"', index = 0, length = value.length, useCharIndex = !charIndexBuggy || length > 10;
          var symbols = useCharIndex && (charIndexBuggy ? value.split("") : value);
          for (; index < length; index++) {
            var charCode = value.charCodeAt(index);
            // If the character is a control character, append its Unicode or
            // shorthand escape sequence; otherwise, append the character as-is.
            switch (charCode) {
              case 8: case 9: case 10: case 12: case 13: case 34: case 92:
                result += Escapes[charCode];
                break;
              default:
                if (charCode < 32) {
                  result += unicodePrefix + toPaddedString(2, charCode.toString(16));
                  break;
                }
                result += useCharIndex ? symbols[index] : value.charAt(index);
            }
          }
          return result + '"';
        };

        // Internal: Recursively serializes an object. Implements the
        // Str(key, holder), JO(value), and JA(value) operations.
        var serialize = function (property, object, callback, properties, whitespace, indentation, stack) {
          var value, className, year, month, date, time, hours, minutes, seconds, milliseconds, results, element, index, length, prefix, result;
          try {
            // Necessary for host object support.
            value = object[property];
          } catch (exception) {}
          if (typeof value == "object" && value) {
            className = getClass.call(value);
            if (className == dateClass && !isProperty.call(value, "toJSON")) {
              if (value > -1 / 0 && value < 1 / 0) {
                // Dates are serialized according to the Date#toJSON method
                // specified in ES 5.1 section 15.9.5.44. See section 15.9.1.15
                // for the ISO 8601 date time string format.
                if (getDay) {
                  // Manually compute the year, month, date, hours, minutes,
                  // seconds, and milliseconds if the getUTC* methods are
                  // buggy. Adapted from @Yaffle's date-shim project.
                  date = floor(value / 864e5);
                  for (year = floor(date / 365.2425) + 1970 - 1; getDay(year + 1, 0) <= date; year++);
                  for (month = floor((date - getDay(year, 0)) / 30.42); getDay(year, month + 1) <= date; month++);
                  date = 1 + date - getDay(year, month);
                  // The time value specifies the time within the day (see ES
                  // 5.1 section 15.9.1.2). The formula (A % B + B) % B is used
                  // to compute A modulo B, as the % operator does not
                  // correspond to the modulo operation for negative numbers.
                  time = (value % 864e5 + 864e5) % 864e5;
                  // The hours, minutes, seconds, and milliseconds are obtained by
                  // decomposing the time within the day. See section 15.9.1.10.
                  hours = floor(time / 36e5) % 24;
                  minutes = floor(time / 6e4) % 60;
                  seconds = floor(time / 1e3) % 60;
                  milliseconds = time % 1e3;
                } else {
                  year = value.getUTCFullYear();
                  month = value.getUTCMonth();
                  date = value.getUTCDate();
                  hours = value.getUTCHours();
                  minutes = value.getUTCMinutes();
                  seconds = value.getUTCSeconds();
                  milliseconds = value.getUTCMilliseconds();
                }
                // Serialize extended years correctly.
                value = (year <= 0 || year >= 1e4 ? (year < 0 ? "-" : "+") + toPaddedString(6, year < 0 ? -year : year) : toPaddedString(4, year)) +
                  "-" + toPaddedString(2, month + 1) + "-" + toPaddedString(2, date) +
                  // Months, dates, hours, minutes, and seconds should have two
                  // digits; milliseconds should have three.
                  "T" + toPaddedString(2, hours) + ":" + toPaddedString(2, minutes) + ":" + toPaddedString(2, seconds) +
                  // Milliseconds are optional in ES 5.0, but required in 5.1.
                  "." + toPaddedString(3, milliseconds) + "Z";
              } else {
                value = null;
              }
            } else if (typeof value.toJSON == "function" && ((className != numberClass && className != stringClass && className != arrayClass) || isProperty.call(value, "toJSON"))) {
              // Prototype <= 1.6.1 adds non-standard toJSON methods to the
              // Number, String, Date, and Array prototypes. JSON 3
              // ignores all toJSON methods on these objects unless they are
              // defined directly on an instance.
              value = value.toJSON(property);
            }
          }
          if (callback) {
            // If a replacement function was provided, call it to obtain the value
            // for serialization.
            value = callback.call(object, property, value);
          }
          if (value === null) {
            return "null";
          }
          className = getClass.call(value);
          if (className == booleanClass) {
            // Booleans are represented literally.
            return "" + value;
          } else if (className == numberClass) {
            // JSON numbers must be finite. Infinity and NaN are serialized as
            // "null".
            return value > -1 / 0 && value < 1 / 0 ? "" + value : "null";
          } else if (className == stringClass) {
            // Strings are double-quoted and escaped.
            return quote("" + value);
          }
          // Recursively serialize objects and arrays.
          if (typeof value == "object") {
            // Check for cyclic structures. This is a linear search; performance
            // is inversely proportional to the number of unique nested objects.
            for (length = stack.length; length--;) {
              if (stack[length] === value) {
                // Cyclic structures cannot be serialized by JSON.stringify.
                throw TypeError();
              }
            }
            // Add the object to the stack of traversed objects.
            stack.push(value);
            results = [];
            // Save the current indentation level and indent one additional level.
            prefix = indentation;
            indentation += whitespace;
            if (className == arrayClass) {
              // Recursively serialize array elements.
              for (index = 0, length = value.length; index < length; index++) {
                element = serialize(index, value, callback, properties, whitespace, indentation, stack);
                results.push(element === undef ? "null" : element);
              }
              result = results.length ? (whitespace ? "[\n" + indentation + results.join(",\n" + indentation) + "\n" + prefix + "]" : ("[" + results.join(",") + "]")) : "[]";
            } else {
              // Recursively serialize object members. Members are selected from
              // either a user-specified list of property names, or the object
              // itself.
              forEach(properties || value, function (property) {
                var element = serialize(property, value, callback, properties, whitespace, indentation, stack);
                if (element !== undef) {
                  // According to ES 5.1 section 15.12.3: "If gap {whitespace}
                  // is not the empty string, let member {quote(property) + ":"}
                  // be the concatenation of member and the space character."
                  // The "space character" refers to the literal space
                  // character, not the space {width} argument provided to
                  // JSON.stringify.
                  results.push(quote(property) + ":" + (whitespace ? " " : "") + element);
                }
              });
              result = results.length ? (whitespace ? "{\n" + indentation + results.join(",\n" + indentation) + "\n" + prefix + "}" : ("{" + results.join(",") + "}")) : "{}";
            }
            // Remove the object from the traversed object stack.
            stack.pop();
            return result;
          }
        };

        // Public: JSON.stringify. See ES 5.1 section 15.12.3.
        exports.stringify = function (source, filter, width) {
          var whitespace, callback, properties, className;
          if (objectTypes[typeof filter] && filter) {
            if ((className = getClass.call(filter)) == functionClass) {
              callback = filter;
            } else if (className == arrayClass) {
              // Convert the property names array into a makeshift set.
              properties = {};
              for (var index = 0, length = filter.length, value; index < length; value = filter[index++], ((className = getClass.call(value)), className == stringClass || className == numberClass) && (properties[value] = 1));
            }
          }
          if (width) {
            if ((className = getClass.call(width)) == numberClass) {
              // Convert the width to an integer and create a string containing
              // width number of space characters.
              if ((width -= width % 1) > 0) {
                for (whitespace = "", width > 10 && (width = 10); whitespace.length < width; whitespace += " ");
              }
            } else if (className == stringClass) {
              whitespace = width.length <= 10 ? width : width.slice(0, 10);
            }
          }
          // Opera <= 7.54u2 discards the values associated with empty string keys
          // ("") only if they are used directly within an object member list
          // (e.g., !("" in { "": 1})).
          return serialize("", (value = {}, value[""] = source, value), callback, properties, whitespace, "", []);
        };
      }

      // Public: Parses a JSON source string.
      if (!has("json-parse")) {
        var fromCharCode = String.fromCharCode;

        // Internal: A map of escaped control characters and their unescaped
        // equivalents.
        var Unescapes = {
          92: "\\",
          34: '"',
          47: "/",
          98: "\b",
          116: "\t",
          110: "\n",
          102: "\f",
          114: "\r"
        };

        // Internal: Stores the parser state.
        var Index, Source;

        // Internal: Resets the parser state and throws a SyntaxError.
        var abort = function () {
          Index = Source = null;
          throw SyntaxError();
        };

        // Internal: Returns the next token, or "$" if the parser has reached
        // the end of the source string. A token may be a string, number, null
        // literal, or Boolean literal.
        var lex = function () {
          var source = Source, length = source.length, value, begin, position, isSigned, charCode;
          while (Index < length) {
            charCode = source.charCodeAt(Index);
            switch (charCode) {
              case 9: case 10: case 13: case 32:
                // Skip whitespace tokens, including tabs, carriage returns, line
                // feeds, and space characters.
                Index++;
                break;
              case 123: case 125: case 91: case 93: case 58: case 44:
                // Parse a punctuator token ({, }, [, ], :, or ,) at
                // the current position.
                value = charIndexBuggy ? source.charAt(Index) : source[Index];
                Index++;
                return value;
              case 34:
                // " delimits a JSON string; advance to the next character and
                // begin parsing the string. String tokens are prefixed with the
                // sentinel @ character to distinguish them from punctuators and
                // end-of-string tokens.
                for (value = "@", Index++; Index < length;) {
                  charCode = source.charCodeAt(Index);
                  if (charCode < 32) {
                    // Unescaped ASCII control characters (those with a code unit
                    // less than the space character) are not permitted.
                    abort();
                  } else if (charCode == 92) {
                    // A reverse solidus (\) marks the beginning of an escaped
                    // control character (including ", \, and /) or Unicode
                    // escape sequence.
                    charCode = source.charCodeAt(++Index);
                    switch (charCode) {
                      case 92: case 34: case 47: case 98: case 116: case 110: case 102: case 114:
                        // Revive escaped control characters.
                        value += Unescapes[charCode];
                        Index++;
                        break;
                      case 117:
                        // \u marks the beginning of a Unicode escape sequence.
                        // Advance to the first character and validate the
                        // four-digit code point.
                        begin = ++Index;
                        for (position = Index + 4; Index < position; Index++) {
                          charCode = source.charCodeAt(Index);
                          // A valid sequence comprises four hexdigits (case-
                          // insensitive) that form a single hexadecimal value.
                          if (!(charCode >= 48 && charCode <= 57 || charCode >= 97 && charCode <= 102 || charCode >= 65 && charCode <= 70)) {
                            // Invalid Unicode escape sequence.
                            abort();
                          }
                        }
                        // Revive the escaped character.
                        value += fromCharCode("0x" + source.slice(begin, Index));
                        break;
                      default:
                        // Invalid escape sequence.
                        abort();
                    }
                  } else {
                    if (charCode == 34) {
                      // An unescaped double-quote character marks the end of the
                      // string.
                      break;
                    }
                    charCode = source.charCodeAt(Index);
                    begin = Index;
                    // Optimize for the common case where a string is valid.
                    while (charCode >= 32 && charCode != 92 && charCode != 34) {
                      charCode = source.charCodeAt(++Index);
                    }
                    // Append the string as-is.
                    value += source.slice(begin, Index);
                  }
                }
                if (source.charCodeAt(Index) == 34) {
                  // Advance to the next character and return the revived string.
                  Index++;
                  return value;
                }
                // Unterminated string.
                abort();
              default:
                // Parse numbers and literals.
                begin = Index;
                // Advance past the negative sign, if one is specified.
                if (charCode == 45) {
                  isSigned = true;
                  charCode = source.charCodeAt(++Index);
                }
                // Parse an integer or floating-point value.
                if (charCode >= 48 && charCode <= 57) {
                  // Leading zeroes are interpreted as octal literals.
                  if (charCode == 48 && ((charCode = source.charCodeAt(Index + 1)), charCode >= 48 && charCode <= 57)) {
                    // Illegal octal literal.
                    abort();
                  }
                  isSigned = false;
                  // Parse the integer component.
                  for (; Index < length && ((charCode = source.charCodeAt(Index)), charCode >= 48 && charCode <= 57); Index++);
                  // Floats cannot contain a leading decimal point; however, this
                  // case is already accounted for by the parser.
                  if (source.charCodeAt(Index) == 46) {
                    position = ++Index;
                    // Parse the decimal component.
                    for (; position < length && ((charCode = source.charCodeAt(position)), charCode >= 48 && charCode <= 57); position++);
                    if (position == Index) {
                      // Illegal trailing decimal.
                      abort();
                    }
                    Index = position;
                  }
                  // Parse exponents. The e denoting the exponent is
                  // case-insensitive.
                  charCode = source.charCodeAt(Index);
                  if (charCode == 101 || charCode == 69) {
                    charCode = source.charCodeAt(++Index);
                    // Skip past the sign following the exponent, if one is
                    // specified.
                    if (charCode == 43 || charCode == 45) {
                      Index++;
                    }
                    // Parse the exponential component.
                    for (position = Index; position < length && ((charCode = source.charCodeAt(position)), charCode >= 48 && charCode <= 57); position++);
                    if (position == Index) {
                      // Illegal empty exponent.
                      abort();
                    }
                    Index = position;
                  }
                  // Coerce the parsed value to a JavaScript number.
                  return +source.slice(begin, Index);
                }
                // A negative sign may only precede numbers.
                if (isSigned) {
                  abort();
                }
                // true, false, and null literals.
                if (source.slice(Index, Index + 4) == "true") {
                  Index += 4;
                  return true;
                } else if (source.slice(Index, Index + 5) == "false") {
                  Index += 5;
                  return false;
                } else if (source.slice(Index, Index + 4) == "null") {
                  Index += 4;
                  return null;
                }
                // Unrecognized token.
                abort();
            }
          }
          // Return the sentinel $ character if the parser has reached the end
          // of the source string.
          return "$";
        };

        // Internal: Parses a JSON value token.
        var get = function (value) {
          var results, hasMembers;
          if (value == "$") {
            // Unexpected end of input.
            abort();
          }
          if (typeof value == "string") {
            if ((charIndexBuggy ? value.charAt(0) : value[0]) == "@") {
              // Remove the sentinel @ character.
              return value.slice(1);
            }
            // Parse object and array literals.
            if (value == "[") {
              // Parses a JSON array, returning a new JavaScript array.
              results = [];
              for (;; hasMembers || (hasMembers = true)) {
                value = lex();
                // A closing square bracket marks the end of the array literal.
                if (value == "]") {
                  break;
                }
                // If the array literal contains elements, the current token
                // should be a comma separating the previous element from the
                // next.
                if (hasMembers) {
                  if (value == ",") {
                    value = lex();
                    if (value == "]") {
                      // Unexpected trailing , in array literal.
                      abort();
                    }
                  } else {
                    // A , must separate each array element.
                    abort();
                  }
                }
                // Elisions and leading commas are not permitted.
                if (value == ",") {
                  abort();
                }
                results.push(get(value));
              }
              return results;
            } else if (value == "{") {
              // Parses a JSON object, returning a new JavaScript object.
              results = {};
              for (;; hasMembers || (hasMembers = true)) {
                value = lex();
                // A closing curly brace marks the end of the object literal.
                if (value == "}") {
                  break;
                }
                // If the object literal contains members, the current token
                // should be a comma separator.
                if (hasMembers) {
                  if (value == ",") {
                    value = lex();
                    if (value == "}") {
                      // Unexpected trailing , in object literal.
                      abort();
                    }
                  } else {
                    // A , must separate each object member.
                    abort();
                  }
                }
                // Leading commas are not permitted, object property names must be
                // double-quoted strings, and a : must separate each property
                // name and value.
                if (value == "," || typeof value != "string" || (charIndexBuggy ? value.charAt(0) : value[0]) != "@" || lex() != ":") {
                  abort();
                }
                results[value.slice(1)] = get(lex());
              }
              return results;
            }
            // Unexpected token encountered.
            abort();
          }
          return value;
        };

        // Internal: Updates a traversed object member.
        var update = function (source, property, callback) {
          var element = walk(source, property, callback);
          if (element === undef) {
            delete source[property];
          } else {
            source[property] = element;
          }
        };

        // Internal: Recursively traverses a parsed JSON object, invoking the
        // callback function for each value. This is an implementation of the
        // Walk(holder, name) operation defined in ES 5.1 section 15.12.2.
        var walk = function (source, property, callback) {
          var value = source[property], length;
          if (typeof value == "object" && value) {
            // forEach can't be used to traverse an array in Opera <= 8.54
            // because its Object#hasOwnProperty implementation returns false
            // for array indices (e.g., ![1, 2, 3].hasOwnProperty("0")).
            if (getClass.call(value) == arrayClass) {
              for (length = value.length; length--;) {
                update(value, length, callback);
              }
            } else {
              forEach(value, function (property) {
                update(value, property, callback);
              });
            }
          }
          return callback.call(source, property, value);
        };

        // Public: JSON.parse. See ES 5.1 section 15.12.2.
        exports.parse = function (source, callback) {
          var result, value;
          Index = 0;
          Source = "" + source;
          result = get(lex());
          // If a JSON string contains multiple tokens, it is invalid.
          if (lex() != "$") {
            abort();
          }
          // Reset the parser state.
          Index = Source = null;
          return callback && getClass.call(callback) == functionClass ? walk((value = {}, value[""] = result, value), "", callback) : result;
        };
      }
    }

    exports["runInContext"] = runInContext;
    return exports;
  }

  var JSON3 = runInContext(window, root);

  root.JSON = {
    "parse": JSON3.parse,
    "stringify": JSON3.stringify
  };
}).call(Stripe, this);;

}).call(this);

(function() {
  if (this.Stripe.isDoubleLoaded) {
    return;
  }

  
/**
 * easyXDM
 * http://easyxdm.net/
 * Copyright(c) 2009-2011, Ã˜yvind Sean Kinsey, oyvind@kinsey.no.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */
(function (window, document, location, setTimeout, decodeURIComponent, encodeURIComponent) {

var global = this;
var channelId = Math.floor(Math.random() * 1000000); // randomize the initial id in case of multiple closures loaded
var emptyFn = Function.prototype;
var reURI = /^((http:|https:|file:|chrome\-extension:|chrome:)\/\/([^:\/\s]+)(:\d+)*)/; // returns groups for protocol (2), domain (3) and port (4)
var reParent = /[\-\w]+\/\.\.\//; // matches a foo/../ expression
var reDoubleSlash = /([^:])\/\//g; // matches // anywhere but in the protocol
var namespace = "Stripe"; // stores namespace under which easyXDM object is stored on the page (empty if object is global)
var easyXDM = {};
var IFRAME_PREFIX = "stripeXDM_";
var HAS_NAME_PROPERTY_BUG;
var useHash = false; // whether to use the hash over the query
var flashVersion; // will be set if using flash
var HAS_FLASH_THROTTLED_BUG;


// http://peter.michaux.ca/articles/feature-detection-state-of-the-art-browser-scripting
function isHostMethod(object, property){
    var t = typeof object[property];
    return t == 'function' ||
    (!!(t == 'object' && object[property])) ||
    t == 'unknown';
}

function isHostObject(object, property){
    return !!(typeof(object[property]) == 'object' && object[property]);
}

// http://perfectionkills.com/instanceof-considered-harmful-or-how-to-write-a-robust-isarray/
function isArray(o){
    return Object.prototype.toString.call(o) === '[object Array]';
}

// end
function hasFlash(){
    var name = "Shockwave Flash", mimeType = "application/x-shockwave-flash";

    if (!undef(navigator.plugins) && typeof navigator.plugins[name] == "object") {
        // adapted from the swfobject code
        var description = navigator.plugins[name].description;
        if (description && !undef(navigator.mimeTypes) && navigator.mimeTypes[mimeType] && navigator.mimeTypes[mimeType].enabledPlugin) {
            flashVersion = description.match(/\d+/g);
        }
    }
    if (!flashVersion) {
        var flash;
        try {
            flash = new ActiveXObject("ShockwaveFlash.ShockwaveFlash");
            flashVersion = Array.prototype.slice.call(flash.GetVariable("$version").match(/(\d+),(\d+),(\d+),(\d+)/), 1);
            flash = null;
        }
        catch (notSupportedException) {
        }
    }
    if (!flashVersion) {
        return false;
    }
    var major = parseInt(flashVersion[0], 10), minor = parseInt(flashVersion[1], 10);
    HAS_FLASH_THROTTLED_BUG = major > 9 && minor > 0;
    return true;
}

/*
 * Cross Browser implementation for adding and removing event listeners.
 */
var on, un;
if (isHostMethod(window, "addEventListener")) {
    on = function(target, type, listener){
        target.addEventListener(type, listener, false);
    };
    un = function(target, type, listener){
        target.removeEventListener(type, listener, false);
    };
}
else if (isHostMethod(window, "attachEvent")) {
    on = function(object, sEvent, fpNotify){
        object.attachEvent("on" + sEvent, fpNotify);
    };
    un = function(object, sEvent, fpNotify){
        object.detachEvent("on" + sEvent, fpNotify);
    };
}
else {
    throw new Error("Browser not supported");
}

/*
 * Cross Browser implementation of DOMContentLoaded.
 */
var domIsReady = false, domReadyQueue = [], readyState;
if ("readyState" in document) {
    // If browser is WebKit-powered, check for both 'loaded' (legacy browsers) and
    // 'interactive' (HTML5 specs, recent WebKit builds) states.
    // https://bugs.webkit.org/show_bug.cgi?id=45119
    readyState = document.readyState;
    domIsReady = readyState == "complete" || (~ navigator.userAgent.indexOf('AppleWebKit/') && (readyState == "loaded" || readyState == "interactive"));
}
else {
    // If readyState is not supported in the browser, then in order to be able to fire whenReady functions apropriately
    // when added dynamically _after_ DOM load, we have to deduce wether the DOM is ready or not.
    // We only need a body to add elements to, so the existence of document.body is enough for us.
    domIsReady = !!document.body;
}

function dom_onReady(){
    if (domIsReady) {
        return;
    }
    domIsReady = true;
    for (var i = 0; i < domReadyQueue.length; i++) {
        domReadyQueue[i]();
    }
    domReadyQueue.length = 0;
}


if (!domIsReady) {
    if (isHostMethod(window, "addEventListener")) {
        on(document, "DOMContentLoaded", dom_onReady);
    }
    else {
        on(document, "readystatechange", function(){
            if (document.readyState == "complete") {
                dom_onReady();
            }
        });
        if (document.documentElement.doScroll && window === top) {
            var doScrollCheck = function(){
                if (domIsReady) {
                    return;
                }
                // http://javascript.nwbox.com/IEContentLoaded/
                try {
                    document.documentElement.doScroll("left");
                }
                catch (e) {
                    setTimeout(doScrollCheck, 1);
                    return;
                }
                dom_onReady();
            };
            doScrollCheck();
        }
    }

    // A fallback to window.onload, that will always work
    on(window, "load", dom_onReady);
}
/**
 * This will add a function to the queue of functions to be run once the DOM reaches a ready state.
 * If functions are added after this event then they will be executed immediately.
 * @param {function} fn The function to add
 * @param {Object} scope An optional scope for the function to be called with.
 */
function whenReady(fn, scope){
    if (domIsReady) {
        fn.call(scope);
        return;
    }
    domReadyQueue.push(function(){
        fn.call(scope);
    });
}

/**
 * Returns an instance of easyXDM from the parent window with
 * respect to the namespace.
 *
 * @return An instance of easyXDM (in the parent window)
 */
function getParentObject(){
    var obj = parent;
    if (namespace !== "") {
        for (var i = 0, ii = namespace.split("."); i < ii.length; i++) {
            obj = obj[ii[i]];
        }
    }
    return obj.easyXDM;
}

/*
 * Methods for working with URLs
 */
/**
 * Get the domain name from a url.
 * @param {String} url The url to extract the domain from.
 * @return The domain part of the url.
 * @type {String}
 */
function getDomainName(url){
    return url.match(reURI)[3];
}

/**
 * Get the port for a given URL, or "" if none
 * @param {String} url The url to extract the port from.
 * @return The port part of the url.
 * @type {String}
 */
function getPort(url){
    return url.match(reURI)[4] || "";
}

/**
 * Returns  a string containing the schema, domain and if present the port
 * @param {String} url The url to extract the location from
 * @return {String} The location part of the url
 */
function getLocation(url){
    var m = url.toLowerCase().match(reURI);
    var proto, domain, port = "", res = "";
    try {
        proto = m[2];
        domain = m[3];
        port = m[4] || "";
        if ((proto == "http:" && port == ":80") || (proto == "https:" && port == ":443")) {
            port = "";
        }
        res = proto + "//" + domain + port;
    }
    catch (e) {
        res = url;
    }

    return res;
}

/**
 * Resolves a relative url into an absolute one.
 * @param {String} url The path to resolve.
 * @return {String} The resolved url.
 */
function resolveUrl(url){

    // replace all // except the one in proto with /
    url = url.replace(reDoubleSlash, "$1/");

    // If the url is a valid url we do nothing
    if (!url.match(/^(http||https):\/\//)) {
        // If this is a relative path
        var path = (url.substring(0, 1) === "/") ? "" : location.pathname;
        if (path.substring(path.length - 1) !== "/") {
            path = path.substring(0, path.lastIndexOf("/") + 1);
        }

        url = location.protocol + "//" + location.host + path + url;
    }

    // reduce all 'xyz/../' to just ''
    while (reParent.test(url)) {
        url = url.replace(reParent, "");
    }

    return url;
}

/**
 * Appends the parameters to the given url.<br/>
 * The base url can contain existing query parameters.
 * @param {String} url The base url.
 * @param {Object} parameters The parameters to add.
 * @return {String} A new valid url with the parameters appended.
 */
function appendQueryParameters(url, parameters){

    var hash = "", indexOf = url.indexOf("#");
    if (indexOf !== -1) {
        hash = url.substring(indexOf);
        url = url.substring(0, indexOf);
    }
    var q = [];
    var stripeKey;
    for (var key in parameters) {
        if (parameters.hasOwnProperty(key)) {
            stripeKey = 'stripe_' + key;
            q.push(stripeKey + "=" + encodeURIComponent(parameters[key]));
        }
    }
    return url + (useHash ? "#" : (url.indexOf("?") == -1 ? "?" : "&")) + q.join("&") + hash;
}


// build the query object either from location.query, if it contains the xdm_e argument, or from location.hash
var query = (function(input){
    input = input.substring(1).split("&");
    var data = {}, pair, i = input.length;
    while (i--) {
        pair = input[i].split("=");
        data[pair[0].replace(/^stripe_/, '')] = decodeURIComponent(pair[1]);
    }
    return data;
}(/stripe_xdm_e=/.test(location.search) ? location.search : location.hash));

/*
 * Helper methods
 */
/**
 * Helper for checking if a variable/property is undefined
 * @param {Object} v The variable to test
 * @return {Boolean} True if the passed variable is undefined
 */
function undef(v){
    return typeof v === "undefined";
}

/**
 * A safe implementation of HTML5 JSON. Feature testing is used to make sure the implementation works.
 * @return {JSON} A valid JSON conforming object, or null if not found.
 */
var getJSON = function(){
  // Stripe polyfills this
  return Stripe.JSON;
};

/**
 * Applies properties from the source object to the target object.<br/>
 * @param {Object} target The target of the properties.
 * @param {Object} source The source of the properties.
 * @param {Boolean} noOverwrite Set to True to only set non-existing properties.
 */
function apply(destination, source, noOverwrite){
    var member;
    for (var prop in source) {
        if (source.hasOwnProperty(prop)) {
            if (prop in destination) {
                member = source[prop];
                if (typeof member === "object") {
                    apply(destination[prop], member, noOverwrite);
                }
                else if (!noOverwrite) {
                    destination[prop] = source[prop];
                }
            }
            else {
                destination[prop] = source[prop];
            }
        }
    }
    return destination;
}

// This tests for the bug in IE where setting the [name] property using javascript causes the value to be redirected into [submitName].
function testForNamePropertyBug(){
    var form = document.body.appendChild(document.createElement("form")), input = form.appendChild(document.createElement("input"));
    input.name = IFRAME_PREFIX + "TEST" + channelId; // append channelId in order to avoid caching issues
    HAS_NAME_PROPERTY_BUG = input !== form.elements[input.name];
    document.body.removeChild(form);
}

/**
 * Creates a frame and appends it to the DOM.
 * @param config {object} This object can have the following properties
 * <ul>
 * <li> {object} prop The properties that should be set on the frame. This should include the 'src' property.</li>
 * <li> {object} attr The attributes that should be set on the frame.</li>
 * <li> {DOMElement} container Its parent element (Optional).</li>
 * <li> {function} onLoad A method that should be called with the frames contentWindow as argument when the frame is fully loaded. (Optional)</li>
 * </ul>
 * @return The frames DOMElement
 * @type DOMElement
 */
function createFrame(config){
    if (undef(HAS_NAME_PROPERTY_BUG)) {
        testForNamePropertyBug();
    }
    var frame;
    // This is to work around the problems in IE6/7 with setting the name property.
    // Internally this is set as 'submitName' instead when using 'iframe.name = ...'
    // This is not required by easyXDM itself, but is to facilitate other use cases
    if (HAS_NAME_PROPERTY_BUG) {
        frame = document.createElement("<iframe name=\"" + config.props.name + "\"/>");
    }
    else {
        frame = document.createElement("IFRAME");
        frame.name = config.props.name;
    }

    frame.id = frame.name = config.props.name;
    delete config.props.name;

    if (typeof config.container == "string") {
        config.container = document.getElementById(config.container);
    }

    if (!config.container) {
        // This needs to be hidden like this, simply setting display:none and the like will cause failures in some browsers.
        apply(frame.style, {
            position: "absolute",
            top: "-2000px",
            // Avoid potential horizontal scrollbar
            left: "0px"
        });
        config.container = document.body;
    }

    // STRIPE: We changed this for CSP reasons and that we don't support IE6
    // HACK: IE cannot have the src attribute set when the frame is appended
    //       into the container, so we set it to "javascript:false" as a
    //       placeholder for now.  If we left the src undefined, it would
    //       instead default to "about:blank", which causes SSL mixed-content
    //       warnings in IE6 when on an SSL parent page.
    var src = config.props.src;
    config.props.src = "about:blank";

    // transfer properties to the frame
    apply(frame, config.props);

    frame.border = frame.frameBorder = 0;
    frame.allowTransparency = true;

    var syntheticAck = false;

    // If we support postmessage, then we wait for the ack
    // If we don't support postmessage, we just auto-ack after the onload event
    if (config.onFrameAck && 'postMessage' in window) {
        // IE8 Doesn't support CSP, so we can synthetically ack
        if (window.addEventListener) {
            window.addEventListener('message', function(e) {
                var strippedFrameUrl = Stripe._iframeBaseUrl.replace(/^https?:\/\//, '').replace(/\/.*$/, '');
                var strippedOriginUrl = e.origin.replace(/^https?:\/\//, '').replace(/\/.*$/, '');
                if (strippedFrameUrl === strippedOriginUrl) {
                    if (e.data === 'stripe:ack') {
                        config.onFrameAck(true);
                    }
                }
            }, false);
        }
        else {
            syntheticAck = true;
        }
    }
    else {
        syntheticAck = true;
    }

    config.container.appendChild(frame);

    if (config.onLoad) {
        on(frame, "load", function() {
            // Call onload first
            config.onLoad.apply(config, arguments);
            // Then synthetically ack if we need
            if (syntheticAck) {
                config.onFrameAck(false);
            }
        });
    }
    if (config.onError) {
        on(frame, "error", function() {
            config.onError.apply(config, arguments);
        });
    }

    frame.src = src;

    if (config.onAsyncInject) {
      setTimeout(function(){
          config.onAsyncInject.call(config, frame);
      }, 5000);
    }

    config.props.src = src;

    return frame;
}

/*
 * Functions related to stacks
 */
/**
 * Prepares an array of stack-elements suitable for the current configuration
 * @param {Object} config The Transports configuration. See easyXDM.Socket for more.
 * @return {Array} An array of stack-elements with the TransportElement at index 0.
 */
function prepareTransportStack(config){
    var protocol = config.protocol, stackEls;
    config.isHost = config.isHost || undef(query.xdm_p);
    useHash = config.hash || false;

    if (!config.props) {
        config.props = {};
    }
    if (!config.isHost) {
        config.channel = query.xdm_c.replace(/["'<>\\]/g, "");
        config.secret = query.xdm_s;
        config.remote = query.xdm_e.replace(/["'<>\\]/g, "");
        ;
        protocol = query.xdm_p;
    }
    else {
        config.remote = resolveUrl(config.remote);
        config.channel = config.channel || "default" + channelId++;
        config.secret = Math.random().toString(16).substring(2);
        if (undef(protocol)) {
            if (isHostMethod(window, "postMessage") || isHostMethod(document, "postMessage")) {
                /*
                 * This is supported in IE8+, Firefox 3+, Opera 9+, Chrome 2+ and Safari 4+
                 */
                protocol = "1";
            }
            else if (config.swf && isHostMethod(window, "ActiveXObject") && hasFlash()) {
                /*
                 * The Flash transport superseedes the NixTransport as the NixTransport has been blocked by MS
                 */
                protocol = "6";
            }
            else {
                // TODO: handle people who don't have flash in IE7
                throw new Error('No suitable transport protocol for Stripe.js');
            }
        }
    }
    config.protocol = protocol; // for conditional branching
    switch (protocol) {
        case "1":
            stackEls = [new easyXDM.stack.PostMessageTransport(config)];
            break;
        case "6":
            if (!flashVersion) {
                hasFlash();
            }
            stackEls = [new easyXDM.stack.FlashTransport(config)];
            break;
    }
    if (!stackEls) {
      config.onInternalError.call(config, 'BadXDMProtocol');
      return;
    }
    // this behavior is responsible for buffering outgoing messages, and for performing lazy initialization
    stackEls.push(new easyXDM.stack.QueueBehavior({
        lazy: config.lazy,
        remove: true
    }));
    return stackEls;
}

/**
 * Chains all the separate stack elements into a single usable stack.<br/>
 * If an element is missing a necessary method then it will have a pass-through method applied.
 * @param {Array} stackElements An array of stack elements to be linked.
 * @return {easyXDM.stack.StackElement} The last element in the chain.
 */
function chainStack(stackElements){
    var stackEl, defaults = {
        incoming: function(message, origin){
            this.up.incoming(message, origin);
        },
        outgoing: function(message, recipient){
            this.down.outgoing(message, recipient);
        },
        callback: function(success){
            this.up.callback(success);
        },
        init: function(){
            this.down.init();
        },
        destroy: function(){
            this.down.destroy();
        }
    };
    for (var i = 0, len = stackElements.length; i < len; i++) {
        stackEl = stackElements[i];
        apply(stackEl, defaults, true);
        if (i !== 0) {
            stackEl.down = stackElements[i - 1];
        }
        if (i !== len - 1) {
            stackEl.up = stackElements[i + 1];
        }
    }
    return stackEl;
}

/**
 * This will remove a stackelement from its stack while leaving the stack functional.
 * @param {Object} element The elment to remove from the stack.
 */
function removeFromStack(element){
    element.up.down = element.down;
    element.down.up = element.up;
    element.up = element.down = null;
}

/*
 * Export the main object and any other methods applicable
 */
/**
 * @class easyXDM
 * A javascript library providing cross-browser, cross-domain messaging/RPC.
 * @version 2.4.19.3
 * @singleton
 */
apply(easyXDM, {
    /**
     * The version of the library
     * @type {string}
     */
    version: "2.4.19.3",
    /**
     * This is a map containing all the query parameters passed to the document.
     * All the values has been decoded using decodeURIComponent.
     * @type {object}
     */
    query: query,
    /**
     * @private
     */
    stack: {},
    /**
     * Applies properties from the source object to the target object.<br/>
     * @param {object} target The target of the properties.
     * @param {object} source The source of the properties.
     * @param {boolean} noOverwrite Set to True to only set non-existing properties.
     */
    apply: apply,

    /**
     * A safe implementation of HTML5 JSON. Feature testing is used to make sure the implementation works.
     * @return {JSON} A valid JSON conforming object, or null if not found.
     */
    getJSONObject: getJSON,
    /**
     * This will add a function to the queue of functions to be run once the DOM reaches a ready state.
     * If functions are added after this event then they will be executed immediately.
     * @param {function} fn The function to add
     * @param {object} scope An optional scope for the function to be called with.
     */
    whenReady: whenReady
});
/**
 * @class easyXDM.DomHelper
 * Contains methods for dealing with the DOM
 * @singleton
 */
easyXDM.DomHelper = {
    /**
     * Provides a consistent interface for adding eventhandlers
     * @param {Object} target The target to add the event to
     * @param {String} type The name of the event
     * @param {Function} listener The listener
     */
    on: on,
    /**
     * Provides a consistent interface for removing eventhandlers
     * @param {Object} target The target to remove the event from
     * @param {String} type The name of the event
     * @param {Function} listener The listener
     */
    un: un
};

(function(){
    // The map containing the stored functions
    var _map = {};

    /**
     * @class easyXDM.Fn
     * This contains methods related to function handling, such as storing callbacks.
     * @singleton
     * @namespace easyXDM
     */
    easyXDM.Fn = {
        /**
         * Stores a function using the given name for reference
         * @param {String} name The name that the function should be referred by
         * @param {Function} fn The function to store
         * @namespace easyXDM.fn
         */
        set: function(name, fn){
            _map[name] = fn;
        },
        /**
         * Retrieves the function referred to by the given name
         * @param {String} name The name of the function to retrieve
         * @param {Boolean} del If the function should be deleted after retrieval
         * @return {Function} The stored function
         * @namespace easyXDM.fn
         */
        get: function(name, del){
            if (!_map.hasOwnProperty(name)) {
                return;
            }
            var fn = _map[name];

            if (del) {
                delete _map[name];
            }
            return fn;
        }
    };

}());

/**
 * @class easyXDM.Socket
 * This class creates a transport channel between two domains that is usable for sending and receiving string-based messages.<br/>
 * The channel is reliable, supports queueing, and ensures that the message originates from the expected domain.<br/>
 * Internally different stacks will be used depending on the browsers features and the available parameters.
 * <h2>How to set up</h2>
 * Setting up the provider:
 * <pre><code>
 * var socket = new easyXDM.Socket({
 * &nbsp; local: "name.html",
 * &nbsp; onReady: function(){
 * &nbsp; &nbsp; &#47;&#47; you need to wait for the onReady callback before using the socket
 * &nbsp; &nbsp; socket.postMessage("foo-message");
 * &nbsp; },
 * &nbsp; onMessage: function(message, origin) {
 * &nbsp;&nbsp; alert("received " + message + " from " + origin);
 * &nbsp; }
 * });
 * </code></pre>
 * Setting up the consumer:
 * <pre><code>
 * var socket = new easyXDM.Socket({
 * &nbsp; remote: "http:&#47;&#47;remotedomain/page.html",
 * &nbsp; remoteHelper: "http:&#47;&#47;remotedomain/name.html",
 * &nbsp; onReady: function(){
 * &nbsp; &nbsp; &#47;&#47; you need to wait for the onReady callback before using the socket
 * &nbsp; &nbsp; socket.postMessage("foo-message");
 * &nbsp; },
 * &nbsp; onMessage: function(message, origin) {
 * &nbsp;&nbsp; alert("received " + message + " from " + origin);
 * &nbsp; }
 * });
 * </code></pre>
 * If you are unable to upload the <code>name.html</code> file to the consumers domain then remove the <code>remoteHelper</code> property
 * and easyXDM will fall back to using the HashTransport instead of the NameTransport when not able to use any of the primary transports.
 * @namespace easyXDM
 * @constructor
 * @cfg {String/Window} local The url to the local name.html document, a local static file, or a reference to the local window.
 * @cfg {Boolean} lazy (Consumer only) Set this to true if you want easyXDM to defer creating the transport until really needed.
 * @cfg {String} remote (Consumer only) The url to the providers document.
 * @cfg {String} remoteHelper (Consumer only) The url to the remote name.html file. This is to support NameTransport as a fallback. Optional.
 * @cfg {Number} delay The number of milliseconds easyXDM should try to get a reference to the local window.  Optional, defaults to 2000.
 * @cfg {Number} interval The interval used when polling for messages. Optional, defaults to 300.
 * @cfg {String} channel (Consumer only) The name of the channel to use. Can be used to set consistent iframe names. Must be unique. Optional.
 * @cfg {Function} onMessage The method that should handle incoming messages.<br/> This method should accept two arguments, the message as a string, and the origin as a string. Optional.
 * @cfg {Function} onReady A method that should be called when the transport is ready. Optional.
 * @cfg {DOMElement|String} container (Consumer only) The element, or the id of the element that the primary iframe should be inserted into. If not set then the iframe will be positioned off-screen. Optional.
 * @cfg {Array/String} acl (Provider only) Here you can specify which '[protocol]://[domain]' patterns that should be allowed to act as the consumer towards this provider.<br/>
 * This can contain the wildcards ? and *.  Examples are 'http://example.com', '*.foo.com' and '*dom?.com'. If you want to use reqular expressions then you pattern needs to start with ^ and end with $.
 * If none of the patterns match an Error will be thrown.
 * @cfg {Object} props (Consumer only) Additional properties that should be applied to the iframe. This can also contain nested objects e.g: <code>{style:{width:"100px", height:"100px"}}</code>.
 * Properties such as 'name' and 'src' will be overrided. Optional.
 */
easyXDM.Socket = function(config){

    // create the stack
    var stack = chainStack(prepareTransportStack(config).concat([{
        incoming: function(message, origin){
            config.onMessage(message, origin);
        },
        callback: function(success){
            if (config.onReady) {
                config.onReady(success);
            }
        }
    }])), recipient = getLocation(config.remote);

    // set the origin
    this.origin = getLocation(config.remote);

    /**
     * Initiates the destruction of the stack.
     */
    this.destroy = function(){
        stack.destroy();
    };

    /**
     * Posts a message to the remote end of the channel
     * @param {String} message The message to send
     */
    this.postMessage = function(message){
        stack.outgoing(message, recipient);
    };

    stack.init();
};

/**
 * @class easyXDM.stack.FlashTransport
 * FlashTransport is a transport class that uses an SWF with LocalConnection to pass messages back and forth.
 * @namespace easyXDM.stack
 * @constructor
 * @param {Object} config The transports configuration.
 * @cfg {String} remote The remote domain to communicate with.
 * @cfg {String} secret the pre-shared secret used to secure the communication.
 * @cfg {String} swf The path to the swf file
 * @cfg {Boolean} swfNoThrottle Set this to true if you want to take steps to avoid beeing throttled when hidden.
 * @cfg {String || DOMElement} swfContainer Set this if you want to control where the swf is placed
 */
easyXDM.stack.FlashTransport = function(config){
    var pub, // the public interface
 frame, send, targetOrigin, swf, swfContainer;

    function onMessage(message, origin){
        setTimeout(function(){
            pub.up.incoming(message, targetOrigin);
        }, 0);
    }

    /**
     * This method adds the SWF to the DOM and prepares the initialization of the channel
     */
    function addSwf(domain){
        // the differentiating query argument is needed in Flash9 to avoid a caching issue where LocalConnection would throw an error.
        var url = config.swf + "?host=" + config.isHost;
        var id = "easyXDM_swf_" + Math.floor(Math.random() * 10000);

        // prepare the init function that will fire once the swf is ready
        easyXDM.Fn.set("flash_loaded" + domain.replace(/[\-.]/g, "_"), function(){
            easyXDM.stack.FlashTransport[domain].swf = swf = swfContainer.firstChild;
            var queue = easyXDM.stack.FlashTransport[domain].queue;
            for (var i = 0; i < queue.length; i++) {
                queue[i]();
            }
            queue.length = 0;
        });

        if (config.swfContainer) {
            swfContainer = (typeof config.swfContainer == "string") ? document.getElementById(config.swfContainer) : config.swfContainer;
        }
        else {
            // create the container that will hold the swf
            swfContainer = document.createElement('div');

            // http://bugs.adobe.com/jira/browse/FP-4796
            // http://tech.groups.yahoo.com/group/flexcoders/message/162365
            // https://groups.google.com/forum/#!topic/easyxdm/mJZJhWagoLc
            apply(swfContainer.style, HAS_FLASH_THROTTLED_BUG && config.swfNoThrottle ? {
                height: "20px",
                width: "20px",
                position: "fixed",
                right: 0,
                top: 0
            } : {
                height: "1px",
                width: "1px",
                position: "absolute",
                overflow: "hidden",
                right: 0,
                top: 0
            });
            document.body.appendChild(swfContainer);
        }

        // create the object/embed
        var flashVars = "callback=flash_loaded" + encodeURIComponent(domain.replace(/[\-.]/g, "_"))
            + "&proto=" + global.location.protocol
            + "&domain=" + encodeURIComponent(getDomainName(global.location.href))
            + "&port=" + encodeURIComponent(getPort(global.location.href))
            + "&ns=" + encodeURIComponent(namespace);
        swfContainer.innerHTML = "<object height='20' width='20' type='application/x-shockwave-flash' id='" + id + "' data='" + url + "'>" +
        "<param name='allowScriptAccess' value='always'></param>" +
        "<param name='wmode' value='transparent'>" +
        "<param name='movie' value='" +
        url +
        "'></param>" +
        "<param name='flashvars' value='" +
        flashVars +
        "'></param>" +
        "<embed type='application/x-shockwave-flash' FlashVars='" +
        flashVars +
        "' allowScriptAccess='always' wmode='transparent' src='" +
        url +
        "' height='1' width='1'></embed>" +
        "</object>";
    }

    return (pub = {
        outgoing: function(message, domain, fn){
            swf.postMessage(config.channel, message.toString());
            if (fn) {
                fn();
            }
        },
        destroy: function(){
            try {
                swf.destroyChannel(config.channel);
            }
            catch (e) {
            }
            swf = null;
            if (frame) {
                frame.parentNode.removeChild(frame);
                frame = null;
            }
        },
        onDOMReady: function(){

            targetOrigin = config.remote;

            // Prepare the code that will be run after the swf has been intialized
            easyXDM.Fn.set("flash_" + config.channel + "_init", function(){
                setTimeout(function(){
                    pub.up.callback(true);
                });
            });

            // set up the omMessage handler
            easyXDM.Fn.set("flash_" + config.channel + "_onMessage", onMessage);

            config.swf = resolveUrl(config.swf); // reports have been made of requests gone rogue when using relative paths
            var swfdomain = getDomainName(config.swf);
            var fn = function(){
                // set init to true in case the fn was called was invoked from a separate instance
                easyXDM.stack.FlashTransport[swfdomain].init = true;
                swf = easyXDM.stack.FlashTransport[swfdomain].swf;
                // create the channel
                swf.createChannel(config.channel, config.secret, getLocation(config.remote), config.isHost);

                if (config.isHost) {
                    // if Flash is going to be throttled and we want to avoid this
                    if (HAS_FLASH_THROTTLED_BUG && config.swfNoThrottle) {
                        apply(config.props, {
                            position: "fixed",
                            right: 0,
                            top: 0,
                            height: "20px",
                            width: "20px"
                        });
                    }
                    // set up the iframe
                    apply(config.props, {
                        src: appendQueryParameters(config.remote, {
                            xdm_e: getLocation(location.href),
                            xdm_c: config.channel,
                            xdm_p: 6, // 6 = FlashTransport
                            xdm_s: config.secret
                        }),
                        name: IFRAME_PREFIX + config.channel + "_provider"
                    });
                    frame = createFrame(config);
                }
            };

            if (easyXDM.stack.FlashTransport[swfdomain] && easyXDM.stack.FlashTransport[swfdomain].init) {
                // if the swf is in place and we are the consumer
                fn();
            }
            else {
                // if the swf does not yet exist
                if (!easyXDM.stack.FlashTransport[swfdomain]) {
                    // add the queue to hold the init fn's
                    easyXDM.stack.FlashTransport[swfdomain] = {
                        queue: [fn]
                    };
                    addSwf(swfdomain);
                }
                else {
                    easyXDM.stack.FlashTransport[swfdomain].queue.push(fn);
                }
            }
        },
        init: function(){
            whenReady(pub.onDOMReady, pub);
        }
    });
};
/**
 * @class easyXDM.stack.PostMessageTransport
 * PostMessageTransport is a transport class that uses HTML5 postMessage for communication.<br/>
 * <a href="http://msdn.microsoft.com/en-us/library/ms644944(VS.85).aspx">http://msdn.microsoft.com/en-us/library/ms644944(VS.85).aspx</a><br/>
 * <a href="https://developer.mozilla.org/en/DOM/window.postMessage">https://developer.mozilla.org/en/DOM/window.postMessage</a>
 * @namespace easyXDM.stack
 * @constructor
 * @param {Object} config The transports configuration.
 * @cfg {String} remote The remote domain to communicate with.
 */
easyXDM.stack.PostMessageTransport = function(config){
    var pub, // the public interface
 frame, // the remote frame, if any
 callerWindow, // the window that we will call with
 targetOrigin; // the domain to communicate with
    /**
     * Resolves the origin from the event object
     * @private
     * @param {Object} event The messageevent
     * @return {String} The scheme, host and port of the origin
     */
    function _getOrigin(event){
        if (event.origin) {
            // This is the HTML5 property
            return getLocation(event.origin);
        }
        if (event.uri) {
            // From earlier implementations
            return getLocation(event.uri);
        }
        if (event.domain) {
            // This is the last option and will fail if the
            // origin is not using the same schema as we are
            return location.protocol + "//" + event.domain;
        }
        throw new Error("Unable to retrieve the origin of the event");
    }

    /**
     * This is the main implementation for the onMessage event.<br/>
     * It checks the validity of the origin and passes the message on if appropriate.
     * @private
     * @param {Object} event The messageevent
     */
    function _window_onMessage(event){
        var origin = _getOrigin(event);
        if (origin == targetOrigin && typeof event.data == 'string' && event.data.substring(0, config.channel.length + 1) == config.channel + " ") {
            pub.up.incoming(event.data.substring(config.channel.length + 1), origin);
        }
    }

    return (pub = {
        outgoing: function(message, domain, fn){
            try {
                callerWindow.postMessage(config.channel + " " + message, domain || targetOrigin);
                if (fn) {
                    fn();
                }
            }
            catch (e) {
                if (config.onInternalError) {
                  config.onInternalError.call(config, 'CallerWindowError')
                };
            }

        },
        destroy: function(){
            un(window, "message", _window_onMessage);
            if (frame) {
                callerWindow = null;
                frame.parentNode.removeChild(frame);
                frame = null;
            }
        },
        onDOMReady: function(){
            targetOrigin = getLocation(config.remote);
            if (config.isHost) {
                // add the event handler for listening
                var waitForReady = function(event){
                    if (event.data == config.channel + "-ready") {
                        // replace the eventlistener
                        callerWindow = ("postMessage" in frame.contentWindow) ? frame.contentWindow : frame.contentWindow.document;
                        un(window, "message", waitForReady);
                        on(window, "message", _window_onMessage);
                        setTimeout(function(){
                            pub.up.callback(true);
                        }, 0);
                    }
                };
                on(window, "message", waitForReady);

                // set up the iframe
                apply(config.props, {
                    src: appendQueryParameters(config.remote, {
                        xdm_e: getLocation(location.href),
                        xdm_c: config.channel,
                        xdm_p: 1 // 1 = PostMessage
                    }),
                    name: IFRAME_PREFIX + config.channel + "_provider"
                });
                frame = createFrame(config);
            }
            else {
                // add the event handler for listening
                on(window, "message", _window_onMessage);
                callerWindow = ("postMessage" in window.parent) ? window.parent : window.parent.document;
                callerWindow.postMessage(config.channel + "-ready", targetOrigin);

                setTimeout(function(){
                    pub.up.callback(true);
                }, 0);
            }
        },
        init: function(){
            whenReady(pub.onDOMReady, pub);
        }
    });
};
/**
 * @class easyXDM.stack.QueueBehavior
 * This is a behavior that enables queueing of messages. <br/>
 * It will buffer incoming messages and dispach these as fast as the underlying transport allows.
 * This will also fragment/defragment messages so that the outgoing message is never bigger than the
 * set length.
 * @namespace easyXDM.stack
 * @constructor
 * @param {Object} config The behaviors configuration. Optional.
 * @cfg {Number} maxLength The maximum length of each outgoing message. Set this to enable fragmentation.
 */
easyXDM.stack.QueueBehavior = function(config){
    var pub, queue = [], waiting = true, incoming = "", destroying, maxLength = 0, lazy = false, doFragment = false;

    function dispatch(){
        if (config.remove && queue.length === 0) {
            removeFromStack(pub);
            return;
        }
        if (waiting || queue.length === 0 || destroying) {
            return;
        }
        waiting = true;
        var message = queue.shift();

        pub.down.outgoing(message.data, message.origin, function(success){
            waiting = false;
            if (message.callback) {
                setTimeout(function(){
                    message.callback(success);
                }, 0);
            }
            dispatch();
        });
    }
    return (pub = {
        init: function(){
            if (undef(config)) {
                config = {};
            }
            if (config.maxLength) {
                maxLength = config.maxLength;
                doFragment = true;
            }
            if (config.lazy) {
                lazy = true;
            }
            else {
                pub.down.init();
            }
        },
        callback: function(success){
            waiting = false;
            var up = pub.up; // in case dispatch calls removeFromStack
            dispatch();
            up.callback(success);
        },
        incoming: function(message, origin){
            if (doFragment) {
                var indexOf = message.indexOf("_"), seq = parseInt(message.substring(0, indexOf), 10);
                incoming += message.substring(indexOf + 1);
                if (seq === 0) {
                    if (config.encode) {
                        incoming = decodeURIComponent(incoming);
                    }
                    pub.up.incoming(incoming, origin);
                    incoming = "";
                }
            }
            else {
                pub.up.incoming(message, origin);
            }
        },
        outgoing: function(message, origin, fn){
            if (config.encode) {
                message = encodeURIComponent(message);
            }
            var fragments = [], fragment;
            if (doFragment) {
                // fragment into chunks
                while (message.length !== 0) {
                    fragment = message.substring(0, maxLength);
                    message = message.substring(fragment.length);
                    fragments.push(fragment);
                }
                // enqueue the chunks
                while ((fragment = fragments.shift())) {
                    queue.push({
                        data: fragments.length + "_" + fragment,
                        origin: origin,
                        callback: fragments.length === 0 ? fn : null
                    });
                }
            }
            else {
                queue.push({
                    data: message,
                    origin: origin,
                    callback: fn
                });
            }
            if (lazy) {
                pub.down.init();
            }
            else {
                dispatch();
            }
        },
        destroy: function(){
            destroying = true;
            pub.down.destroy();
        }
    });
};

Stripe.easyXDM = easyXDM;
})(window, document, location, window.setTimeout, decodeURIComponent, encodeURIComponent);;

}).call(this);

(function() {
  var __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  if (this.Stripe.isDoubleLoaded) {
    return;
  }

  this.Stripe.utils = (function() {
    var rtrim;

    function utils() {}

    rtrim = /^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g;

    utils.trim = function(text) {
      if (text === null) {
        return '';
      }
      return (text + '').replace(rtrim, '');
    };

    utils.serialize = function(object, result, scope) {
      var e, key, value;
      if (result == null) {
        result = [];
      }
      try {
        for (key in object) {
          value = object[key];
          if (scope) {
            key = "" + scope + "[" + key + "]";
          }
          if (typeof value === 'object') {
            this.serialize(value, result, key);
          } else {
            result.push("" + key + "=" + (encodeURIComponent(value)));
          }
        }
        return result.join('&').replace(/%20/g, '+');
      } catch (_error) {
        e = _error;
        throw new Error('Unable to serialize: ' + object);
      }
    };

    utils.underscore = function(str) {
      return (str + '').replace(/([A-Z])/g, function($1) {
        return "_" + ($1.toLowerCase());
      }).replace(/-/g, '_');
    };

    utils.underscoreKeys = function(data) {
      var key, value, _results;
      _results = [];
      for (key in data) {
        value = data[key];
        delete data[key];
        _results.push(data[this.underscore(key)] = value);
      }
      return _results;
    };

    utils.isElement = function(el) {
      if (typeof el !== 'object') {
        return false;
      }
      if (el.jquery) {
        return true;
      }
      return el.nodeType === 1;
    };

    utils.paramsFromForm = function(form, whitelist) {
      var attr, input, inputs, select, selects, values, _i, _j, _len, _len1;
      if (whitelist == null) {
        whitelist = [];
      }
      if (form.jquery) {
        form = form[0];
      }
      inputs = form.getElementsByTagName('input');
      selects = form.getElementsByTagName('select');
      values = {};
      for (_i = 0, _len = inputs.length; _i < _len; _i++) {
        input = inputs[_i];
        attr = this.underscore(input.getAttribute('data-stripe'));
        if (__indexOf.call(whitelist, attr) < 0) {
          continue;
        }
        values[attr] = input.value;
      }
      for (_j = 0, _len1 = selects.length; _j < _len1; _j++) {
        select = selects[_j];
        attr = this.underscore(select.getAttribute('data-stripe'));
        if (__indexOf.call(whitelist, attr) < 0) {
          continue;
        }
        if (select.selectedIndex != null) {
          values[attr] = select.options[select.selectedIndex].value;
        }
      }
      return values;
    };

    utils.validateProtocol = function(key) {
      var _ref;
      if (!key || typeof key !== 'string') {
        return;
      }
      if (/_live_/g.test(key) && window.location.protocol !== 'https:') {
        if (((_ref = window.console) != null ? _ref.warn : void 0) != null) {
          return window.console.warn('You are using Stripe.js in live mode over an insecure connection. ' + 'This is considered unsafe. Please conduct live requests only on ' + 'sites served over https. ' + 'For more info, see https://stripe.com/help/ssl');
        }
      }
    };

    utils.validateKey = function(key) {
      if (!key || typeof key !== 'string') {
        throw new Error('You did not set a valid publishable key. ' + 'Call Stripe.setPublishableKey() with your publishable key. ' + 'For more info, see https://stripe.com/docs/stripe.js');
      }
      if (/\s/g.test(key)) {
        throw new Error('Your key is invalid, as it contains whitespace. ' + 'For more info, see https://stripe.com/docs/stripe.js');
      }
      if (/^sk_/.test(key)) {
        throw new Error('You are using a secret key with Stripe.js, instead of the publishable one. ' + 'For more info, see https://stripe.com/docs/stripe.js');
      }
    };

    return utils;

  })();

}).call(this);

(function() {
  var requestID,
    __slice = [].slice;

  requestID = new Date().getTime();

  if (this.Stripe.isDoubleLoaded) {
    return;
  }

  this.Stripe.ajaxJSONP = function(options) {
    var abort, abortTimeout, callbackName, head, script, xhr;
    if (options == null) {
      options = {};
    }
    callbackName = 'sjsonp' + (++requestID);
    script = document.createElement('script');
    abortTimeout = null;
    abort = function(reason) {
      var _ref;
      if (reason == null) {
        reason = 'abort';
      }
      clearTimeout(abortTimeout);
      if ((_ref = script.parentNode) != null) {
        _ref.removeChild(script);
      }
      if (callbackName in window) {
        window[callbackName] = (function() {});
      }
      return typeof options.complete === "function" ? options.complete(reason, xhr, options) : void 0;
    };
    xhr = {
      abort: abort
    };
    script.onerror = function() {
      xhr.abort();
      return typeof options.error === "function" ? options.error(xhr, options) : void 0;
    };
    window[callbackName] = function() {
      var args, e;
      args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      clearTimeout(abortTimeout);
      script.parentNode.removeChild(script);
      try {
        delete window[callbackName];
      } catch (_error) {
        e = _error;
        window[callbackName] = void 0;
      }
      if (typeof options.success === "function") {
        options.success.apply(options, __slice.call(args).concat([xhr]));
      }
      return typeof options.complete === "function" ? options.complete('success', xhr, options) : void 0;
    };
    options.data || (options.data = {});
    options.data.callback = callbackName;
    if (options.method) {
      options.data._method = options.method;
    }
    script.src = options.url + '?' + Stripe.utils.serialize(options.data);
    head = document.getElementsByTagName('head')[0];
    head.appendChild(script);
    if (options.timeout > 0) {
      abortTimeout = setTimeout(function() {
        return xhr.abort('timeout');
      }, options.timeout);
    }
    return xhr;
  };

}).call(this);

(function() {
  var Xhr, defaultHeaders, getRequest, handleReadyState, init, invalidJSON, rTwoHundred, setHeaders, urlappend,
    __hasProp = {}.hasOwnProperty;

  if (this.Stripe.isDoubleLoaded) {
    return;
  }

  defaultHeaders = {
    contentType: 'application/x-www-form-urlencoded',
    accept: {
      json: 'application/json'
    }
  };

  rTwoHundred = /^(20\d|1223)$/;

  invalidJSON = 'invalid_json_response';

  handleReadyState = function(r, success, error) {
    return function() {
      if (r._aborted) {
        return error(r.request, 'abort');
      }
      if (r.request && r.request.readyState === 4) {
        r.request.onreadystatechange = (function() {});
        if (r.request.status === 0) {
          return error(r.request, 'empty_response');
        } else if (rTwoHundred.test(r.request.status)) {
          return success(r.request, r.request.status);
        } else {
          return success(r.request, r.request.status);
        }
      }
    };
  };

  setHeaders = function(http, o) {
    var h, headers, _results;
    headers = o.headers || {};
    headers.Accept || (headers.Accept = defaultHeaders.accept.json);
    headers['Content-Type'] || (headers['Content-Type'] = defaultHeaders.contentType);
    _results = [];
    for (h in headers) {
      if (!__hasProp.call(headers, h)) continue;
      if ('setRequestHeader' in http) {
        _results.push(http.setRequestHeader(h, headers[h]));
      } else {
        _results.push(void 0);
      }
    }
    return _results;
  };

  urlappend = function(url, s) {
    if (/\?/.test(url)) {
      return url + '&' + s;
    } else {
      return url + '?' + s;
    }
  };

  getRequest = function(fn, err) {
    var data, e, http, key, method, o, url, _ref, _xhr;
    o = this.o;
    method = (o.method || 'GET').toUpperCase();
    url = o.url;
    key = (_ref = o.data) != null ? _ref.key : void 0;
    data = Stripe.utils.serialize(o.data);
    http = void 0;
    if (method === 'GET' && data) {
      url = urlappend(url, data);
      data = null;
    }
    _xhr = new XMLHttpRequest();
    _xhr.open(method, url, true);
    setHeaders(_xhr, o);
    _xhr.onreadystatechange = handleReadyState(this, fn, err);
    try {
      _xhr.send(data);
    } catch (_error) {
      e = _error;
      Stripe.reportError('XHR-' + e.toString());
      err(_xhr, 'xhr_send_failure');
    }
    return _xhr;
  };

  Xhr = function(o) {
    this.o = o;
    return init.apply(this, arguments);
  };

  init = function(o) {
    var complete, error, success;
    this.url = o.url;
    this.timeout = null;
    this._successHandler = (function() {});
    this._errorHandlers = [];
    this._completeHandlers = [];
    if (o.timeout) {
      this.timeout = setTimeout((function(_this) {
        return function() {
          return _this.abort();
        };
      })(this), o.timeout);
    }
    if (o.success) {
      this._successHandler = function() {
        return o.success.apply(o, arguments);
      };
    }
    if (o.error) {
      this._errorHandlers.push(function() {
        return o.error.apply(o, arguments);
      });
    }
    if (o.complete) {
      this._completeHandlers.push(function() {
        return o.complete.apply(o, arguments);
      });
    }
    complete = (function(_this) {
      return function(resp, status) {
        var _results;
        o.timeout && clearTimeout(_this.timeout);
        _this.timeout = null;
        _results = [];
        while (_this._completeHandlers.length > 0) {
          _results.push(_this._completeHandlers.shift()(status, resp, o));
        }
        return _results;
      };
    })(this);
    success = (function(_this) {
      return function(resp, status) {
        var err, out, r;
        r = resp.responseText;
        if (r && r.length) {
          try {
            out = Stripe.JSON.parse(r);
            _this._successHandler(out, status, resp);
            return complete(out, 'success');
          } catch (_error) {
            err = _error;
            return error(resp, invalidJSON);
          }
        } else {
          return error(resp, 'empty_response');
        }
      };
    })(this);
    error = (function(_this) {
      return function(resp, msg) {
        var err, out, r;
        r = resp.responseText;
        out = void 0;
        if (r && r.length && msg !== invalidJSON) {
          try {
            out = Stripe.JSON.parse(r);
          } catch (_error) {
            err = _error;
            msg = msg + '_AND_' + invalidJSON;
          }
        }
        while (_this._errorHandlers.length > 0) {
          _this._errorHandlers.shift()(out || resp, msg);
        }
        Stripe.reportError(msg);
        Stripe._fallBackToOldStripeJsTechniques();
        return Stripe.request(_this.o, true);
      };
    })(this);
    return this.request = getRequest.call(this, success, error);
  };

  Xhr.prototype = {
    abort: function() {
      var _ref;
      this._aborted = true;
      return (_ref = this.request) != null ? _ref.abort() : void 0;
    }
  };

  this.Stripe.xhr = function(o) {
    return new Xhr(o);
  };

}).call(this);

(function() {
  var Iframe, easyXDM, fallbackToOldStripejs,
    __hasProp = {}.hasOwnProperty;

  if (this.Stripe.isDoubleLoaded) {
    return;
  }

  Iframe = function(options) {
    this.options = options;
    options.requestId = Stripe._callCount;
    options.endpoint = Stripe.endpoint;
    options.trackPerf = Stripe.trackPerf;
    this.iframeTimeout = setTimeout(function() {
      Stripe._fallBackToOldStripeJsTechniques();
      if (Stripe._iframePendingRequests[options.requestId]) {
        Stripe.request(Stripe._iframePendingRequests[options.requestId], true);
        delete Stripe._iframePendingRequests[options.requestId];
      }
      return Stripe._callCache[options.requestId] = function() {
        return Stripe.reportError('TimeoutEventualReturnError');
      };
    }, 10000);
    Stripe._iframePendingRequests[options.requestId] = options;
    Stripe._callCache[options.requestId] = (function(_this) {
      return function() {
        clearTimeout(_this.iframeTimeout);
        delete Stripe._iframePendingRequests[options.requestId];
        options.success.apply(options, arguments);
        return typeof options.complete === "function" ? options.complete('success', null, options) : void 0;
      };
    })(this);
    Stripe._callCount += 1;
    return Stripe._socket.postMessage(Stripe.JSON.stringify(options));
  };

  this.Stripe.iframe = function(o) {
    return new Iframe(o);
  };

  easyXDM = Stripe.easyXDM;

  if (this.Stripe._isChannel) {
    Stripe._socket = new easyXDM.Socket({
      swf: "" + Stripe._iframeBaseUrl + "/v2/stripexdm.swf",
      onMessage: Stripe._channelListener
    });
  } else if (!Stripe._isSafeDomain) {
    fallbackToOldStripejs = function(errInfo) {
      var anyScript, cspBackupAlert, timestamp;
      if ('console' in window && 'warn' in window.console && false) {
        console.warn('Fell back from Stripe.js DSS3 to old transport');
      }
      Stripe._iframeChannelComplete.call(Stripe, false);
      Stripe._callCache = {};
      Stripe.reportError('FB-' + errInfo);
      cspBackupAlert = document.createElement('script');
      timestamp = Math.round(new Date().getTime() / 1000);
      cspBackupAlert.src = "" + Stripe._iframeBaseUrl + "/v2/cspblocked.js?domain=" + (encodeURIComponent(document.location.href)) + "&timestamp=" + timestamp + "&info=" + (encodeURIComponent(errInfo)) + "&payment_user_agent=" + (encodeURIComponent(Stripe.stripejs_ua));
      anyScript = document.getElementsByTagName('script')[0];
      anyScript.parentNode.insertBefore(cspBackupAlert, anyScript);
      fallbackToOldStripejs = function() {};
    };
    Stripe._socket = new easyXDM.Socket({
      swf: "" + Stripe._iframeBaseUrl + "/v2/stripexdm.swf",
      remote: "" + Stripe._iframeBaseUrl + "/v2/channel" + (Stripe.accountDetails ? '-provisioning' : '') + ".html#__stripe_transport__",
      onMessage: Stripe._receiveChannelRelay,
      ackTimeoutDuration: 10000,
      onLoad: function() {
        this._socketLoadTime = +new Date();
        this.onError = function() {};
        this.onAsyncInject = function() {};
        clearTimeout(this.injectTimeout);
        if (!this._socketAckTime) {
          return this.ackTimeout = setTimeout((function(_this) {
            return function() {
              _this.onFrameAck = function() {};
              clearTimeout(_this.loadTimeout);
              return fallbackToOldStripejs('AckTimeoutError');
            };
          })(this), this.ackTimeoutDuration);
        } else if (this.loadTimeout) {
          clearTimeout(this.loadTimeout);
          return Stripe._iframeChannelComplete.call(Stripe, true);
        } else {
          return Stripe.reportError('LoadDelayError', this._socketLoadTime - this._socketAckTime);
        }
      },
      onError: function() {
        this.onLoad = function() {};
        this.onAsyncInject = function() {};
        this.onFrameAck = function() {};
        clearTimeout(this.ackTimeout);
        clearTimeout(this.injectTimeout);
        clearTimeout(this.loadTimeout);
        return fallbackToOldStripejs('IframeOnError');
      },
      onInternalError: function(msg) {
        var id, option, _ref;
        this.onError = function() {};
        this.onLoad = function() {};
        this.onFrameAck = function() {};
        this.onAsyncInject = function() {};
        clearTimeout(this.ackTimeout);
        clearTimeout(this.loadTimeout);
        clearTimeout(this.injectTimeout);
        Stripe.reportError('FB-XDM-' + msg);
        Stripe._fallBackToOldStripeJsTechniques();
        _ref = Stripe._iframePendingRequests;
        for (id in _ref) {
          if (!__hasProp.call(_ref, id)) continue;
          option = _ref[id];
          Stripe._callCache[option.requestId] = function() {};
          delete Stripe._iframePendingRequests[option.requestId];
          Stripe.request(option, true);
        }
      },
      onAsyncInject: function(frame) {
        return this.injectTimeout = setTimeout((function(_this) {
          return function() {
            _this.onError = function() {};
            _this.onLoad = function() {};
            _this.onFrameAck = function() {};
            clearTimeout(_this.ackTimeout);
            clearTimeout(_this.loadTimeout);
            return fallbackToOldStripejs('InjectTimeoutError');
          };
        })(this), this.ackTimeoutDuration);
      },
      onFrameAck: function(realAck) {
        this._socketAckTime = +new Date();
        clearTimeout(this.ackTimeout);
        clearTimeout(this.injectTimeout);
        this.onAsyncInject = function() {};
        this.onError = function() {};
        if (this.ackTimeout) {
          return Stripe._iframeChannelComplete.call(Stripe, true);
        } else if (!this._socketLoadTime) {
          return this.loadTimeout = setTimeout((function(_this) {
            return function() {
              fallbackToOldStripejs('LoadTimeoutError');
              return _this.onLoad = function() {};
            };
          })(this), this.ackTimeoutDuration);
        } else {
          this.onLoad = function() {};
          return Stripe.reportError('AckDelayError', this._socketAckTime - this._socketLoadTime);
        }
      }
    });
  }

}).call(this);

(function() {
  var __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  if (this.Stripe.isDoubleLoaded) {
    return;
  }

  this.Stripe.validator = {
    boolean: function(expected, value) {
      if (!(value === 'true' || value === 'false')) {
        return "Enter a boolean string (true or false)";
      }
    },
    integer: function(expected, value) {
      if (!/^\d+$/.test(value)) {
        return "Enter an integer";
      }
    },
    positive: function(expected, value) {
      if (!(!this.integer(expected, value) && parseInt(value, 10) > 0)) {
        return "Enter a positive value";
      }
    },
    range: function(expected, value) {
      var _ref;
      if (_ref = parseInt(value, 10), __indexOf.call(expected, _ref) < 0) {
        return "Needs to be between " + expected[0] + " and " + expected[expected.length - 1];
      }
    },
    required: function(expected, value) {
      if (expected && ((value == null) || value === '')) {
        return "Required";
      }
    },
    year: function(expected, value) {
      if (!/^\d{4}$/.test(value)) {
        return "Enter a 4-digit year";
      }
    },
    birthYear: function(expected, value) {
      var year;
      year = this.year(expected, value);
      if (year) {
        return year;
      } else if (parseInt(value, 10) > 2000) {
        return "You must be over 18";
      } else if (parseInt(value, 10) < 1900) {
        return "Enter your birth year";
      }
    },
    month: function(expected, value) {
      if (this.integer(expected, value)) {
        return "Please enter a month";
      }
      if (this.range([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], value)) {
        return "Needs to be between 1 and 12";
      }
    },
    choices: function(expected, value) {
      if (__indexOf.call(expected, value) < 0) {
        return "Not an acceptable value for this field";
      }
    },
    email: function(expected, value) {
      if (!/^[^@<\s>]+@[^@<\s>]+$/.test(value)) {
        return "That doesn't look like an email address";
      }
    },
    url: function(expected, value) {
      if (!/^https?:\/\/.+\..+/.test(value)) {
        return "Not a valid url";
      }
    },
    usTaxID: function(expected, value) {
      if (!/^\d{2}-?\d{1}-?\d{2}-?\d{4}$/.test(value)) {
        return "Not a valid tax ID";
      }
    },
    ein: function(expected, value) {
      if (!/^\d{2}-?\d{7}$/.test(value)) {
        return "Not a valid EIN";
      }
    },
    ssnLast4: function(expected, value) {
      if (!/^\d{4}$/.test(value)) {
        return "Not a valid last 4 digits for an SSN";
      }
    },
    ownerPersonalID: function(country, value) {
      var match;
      match = (function() {
        switch (country) {
          case 'CA':
            return /^\d{3}-?\d{3}-?\d{3}$/.test(value);
          case 'US':
            return true;
        }
      })();
      if (!match) {
        return "Not a valid ID";
      }
    },
    bizTaxID: function(country, value) {
      var fieldName, match, regex, regexes, validation, validations, _i, _len;
      validations = {
        'CA': ['Tax ID', [/^\d{9}$/]],
        'US': ['EIN', [/^\d{2}-?\d{7}$/]]
      };
      validation = validations[country];
      if (validation != null) {
        fieldName = validation[0];
        regexes = validation[1];
        match = false;
        for (_i = 0, _len = regexes.length; _i < _len; _i++) {
          regex = regexes[_i];
          if (regex.test(value)) {
            match = true;
            break;
          }
        }
        if (!match) {
          return "Not a valid " + fieldName;
        }
      }
    },
    zip: function(country, value) {
      var match;
      match = (function() {
        switch (country.toUpperCase()) {
          case 'CA':
            return /^[\d\w]{6}$/.test(value != null ? value.replace(/\s+/g, '') : void 0);
          case 'US':
            return /^\d{5}$/.test(value) || /^\d{9}$/.test(value);
        }
      })();
      if (!match) {
        return "Not a valid zip";
      }
    },
    bankAccountNumber: function(expected, value) {
      if (!/^\d{1,17}$/.test(value)) {
        return "Invalid bank account number";
      }
    },
    usRoutingNumber: function(value) {
      var index, part1, part2, part3, total, _i, _ref;
      if (!/^\d{9}$/.test(value)) {
        return "Routing number must have 9 digits";
      }
      total = 0;
      for (index = _i = 0, _ref = value.length - 1; _i <= _ref; index = _i += 3) {
        part1 = parseInt(value.charAt(index), 10) * 3;
        part2 = parseInt(value.charAt(index + 1), 10) * 7;
        part3 = parseInt(value.charAt(index + 2), 10);
        total += part1 + part2 + part3;
      }
      if (!(total !== 0 && total % 10 === 0)) {
        return "Invalid routing number";
      }
    },
    caRoutingNumber: function(value) {
      if (!/^\d{5}\-\d{3}$/.test(value)) {
        return "Invalid transit number";
      }
    },
    routingNumber: function(country, value) {
      switch (country.toUpperCase()) {
        case 'CA':
          return this.caRoutingNumber(value);
        case 'US':
          return this.usRoutingNumber(value);
      }
    },
    phoneNumber: function(expected, value) {
      var number;
      number = value.replace(/[^0-9]/g, '');
      if (number.length !== 10) {
        return "Invalid phone number";
      }
    },
    bizDBA: function(expected, value) {
      if (!/^.{1,23}$/.test(value)) {
        return "Statement descriptors can only have up to 23 characters";
      }
    },
    nameLength: function(expected, value) {
      if (value.length === 1) {
        return 'Names need to be longer than one character';
      }
    }
  };

}).call(this);