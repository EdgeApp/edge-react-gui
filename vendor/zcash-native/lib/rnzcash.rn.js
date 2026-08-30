'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var biggystring = require('biggystring');
var reactNative = require('react-native');

function asyncGeneratorStep(n, t, e, r, o, a, c) {
  try {
    var i = n[a](c),
      u = i.value;
  } catch (n) {
    return void e(n);
  }
  i.done ? t(u) : Promise.resolve(u).then(r, o);
}
function _asyncToGenerator(n) {
  return function () {
    var t = this,
      e = arguments;
    return new Promise(function (r, o) {
      var a = n.apply(t, e);
      function _next(n) {
        asyncGeneratorStep(a, r, o, _next, _throw, "next", n);
      }
      function _throw(n) {
        asyncGeneratorStep(a, r, o, _next, _throw, "throw", n);
      }
      _next(void 0);
    });
  };
}
function _extends() {
  return _extends = Object.assign ? Object.assign.bind() : function (n) {
    for (var e = 1; e < arguments.length; e++) {
      var t = arguments[e];
      for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]);
    }
    return n;
  }, _extends.apply(null, arguments);
}

var RNZcash = reactNative.NativeModules.RNZcash;
function parseJsonObject(value) {
  try {
    return JSON.parse(value);
  } catch (_unused) {
    return {
      errorMessage: value
    };
  }
}
var Tools = {
  deriveViewingKey: function () {
    var _deriveViewingKey = _asyncToGenerator(function* (seedBytesHex, network) {
      var result = yield RNZcash.deriveViewingKey(seedBytesHex, network);
      return result;
    });
    function deriveViewingKey(_x, _x2) {
      return _deriveViewingKey.apply(this, arguments);
    }
    return deriveViewingKey;
  }(),
  getBirthdayHeight: function () {
    var _getBirthdayHeight = _asyncToGenerator(function* (host, port) {
      var result = yield RNZcash.getBirthdayHeight(host, port);
      return result;
    });
    function getBirthdayHeight(_x3, _x4) {
      return _getBirthdayHeight.apply(this, arguments);
    }
    return getBirthdayHeight;
  }(),
  isValidAddress: function () {
    var _isValidAddress = _asyncToGenerator(function* (address, network) {
      if (network === void 0) {
        network = 'mainnet';
      }
      var result = yield RNZcash.isValidAddress(address, network);
      return result;
    });
    function isValidAddress(_x5, _x6) {
      return _isValidAddress.apply(this, arguments);
    }
    return isValidAddress;
  }(),
  getIronwoodActivationHeight: function () {
    var _getIronwoodActivationHeight = _asyncToGenerator(function* (network) {
      if (network === void 0) {
        network = 'mainnet';
      }
      var result = yield RNZcash.ironwoodActivationHeight(network);
      return result;
    });
    function getIronwoodActivationHeight(_x7) {
      return _getIronwoodActivationHeight.apply(this, arguments);
    }
    return getIronwoodActivationHeight;
  }()
};
var Synchronizer = /*#__PURE__*/function () {
  function Synchronizer(alias, network) {
    this.eventEmitter = new reactNative.NativeEventEmitter(RNZcash);
    this.subscriptions = [];
    this.alias = alias;
    this.network = network;
  }
  var _proto = Synchronizer.prototype;
  _proto.stop = /*#__PURE__*/function () {
    var _stop = _asyncToGenerator(function* () {
      this.unsubscribe();
      var result = yield RNZcash.stop(this.alias);
      return result;
    });
    function stop() {
      return _stop.apply(this, arguments);
    }
    return stop;
  }();
  _proto.initialize = /*#__PURE__*/function () {
    var _initialize = _asyncToGenerator(function* (initializerConfig) {
      yield RNZcash.initialize(initializerConfig.mnemonicSeed, initializerConfig.birthdayHeight, initializerConfig.alias, initializerConfig.networkName, initializerConfig.defaultHost, initializerConfig.defaultPort, initializerConfig.newWallet);
    });
    function initialize(_x8) {
      return _initialize.apply(this, arguments);
    }
    return initialize;
  }();
  _proto.deriveUnifiedAddress = /*#__PURE__*/function () {
    var _deriveUnifiedAddress = _asyncToGenerator(function* () {
      var result = yield RNZcash.deriveUnifiedAddress(this.alias);
      return result;
    });
    function deriveUnifiedAddress() {
      return _deriveUnifiedAddress.apply(this, arguments);
    }
    return deriveUnifiedAddress;
  }();
  _proto.getLatestNetworkHeight = /*#__PURE__*/function () {
    var _getLatestNetworkHeight = _asyncToGenerator(function* (alias) {
      var result = yield RNZcash.getLatestNetworkHeight(alias);
      return result;
    });
    function getLatestNetworkHeight(_x9) {
      return _getLatestNetworkHeight.apply(this, arguments);
    }
    return getLatestNetworkHeight;
  }();
  _proto.rescan = /*#__PURE__*/function () {
    var _rescan = _asyncToGenerator(function* () {
      yield RNZcash.rescan(this.alias);
    });
    function rescan() {
      return _rescan.apply(this, arguments);
    }
    return rescan;
  }();
  _proto.proposeOrchardToIronwoodMigration = /*#__PURE__*/function () {
    var _proposeOrchardToIronwoodMigration = _asyncToGenerator(function* () {
      var result = yield RNZcash.proposeOrchardToIronwoodMigration(this.alias);
      return parseJsonObject(result);
    });
    function proposeOrchardToIronwoodMigration() {
      return _proposeOrchardToIronwoodMigration.apply(this, arguments);
    }
    return proposeOrchardToIronwoodMigration;
  }();
  _proto.proposeTransfer = /*#__PURE__*/function () {
    var _proposeTransfer = _asyncToGenerator(function* (opts) {
      var result = yield RNZcash.proposeTransfer(this.alias, opts.zatoshi, opts.toAddress, opts.memo);
      return parseJsonObject(result);
    });
    function proposeTransfer(_x10) {
      return _proposeTransfer.apply(this, arguments);
    }
    return proposeTransfer;
  }();
  _proto.proposeFulfillingPaymentURI = /*#__PURE__*/function () {
    var _proposeFulfillingPaymentURI = _asyncToGenerator(function* (paymentUri) {
      var result = yield RNZcash.proposeFulfillingPaymentURI(this.alias, paymentUri);
      return parseJsonObject(result);
    });
    function proposeFulfillingPaymentURI(_x11) {
      return _proposeFulfillingPaymentURI.apply(this, arguments);
    }
    return proposeFulfillingPaymentURI;
  }();
  _proto.createTransfer = /*#__PURE__*/function () {
    var _createTransfer = _asyncToGenerator(function* (opts) {
      try {
        var result = yield RNZcash.createTransfer(this.alias, opts.proposalBase64, opts.mnemonicSeed);
        return parseJsonObject(result);
      } catch (error) {
        var errorMessage = error instanceof Error ? error.message : String(error);
        return {
          errorMessage: errorMessage
        };
      }
    });
    function createTransfer(_x12) {
      return _createTransfer.apply(this, arguments);
    }
    return createTransfer;
  }();
  _proto.broadcastTransfer = /*#__PURE__*/function () {
    var _broadcastTransfer = _asyncToGenerator(function* (txid) {
      var result = yield RNZcash.broadcastTransfer(this.alias, txid);
      return result;
    });
    function broadcastTransfer(_x13) {
      return _broadcastTransfer.apply(this, arguments);
    }
    return broadcastTransfer;
  }();
  _proto.shieldFunds = /*#__PURE__*/function () {
    var _shieldFunds = _asyncToGenerator(function* (shieldFundsInfo) {
      var result = yield RNZcash.shieldFunds(this.alias, shieldFundsInfo.seed, shieldFundsInfo.memo, shieldFundsInfo.threshold);
      return result;
    });
    function shieldFunds(_x14) {
      return _shieldFunds.apply(this, arguments);
    }
    return shieldFunds;
  }();
  _proto.subscribe = function subscribe(_ref) {
    var _this = this;
    var onBalanceChanged = _ref.onBalanceChanged,
      onStatusChanged = _ref.onStatusChanged,
      onTransactionsChanged = _ref.onTransactionsChanged,
      onUpdate = _ref.onUpdate,
      onError = _ref.onError;
    this.callbacks = {
      onBalanceChanged: onBalanceChanged,
      onStatusChanged: onStatusChanged,
      onTransactionsChanged: onTransactionsChanged,
      onUpdate: onUpdate,
      onError: onError
    };
    this.pump()["catch"](function (error) {
      onError({
        alias: _this.alias,
        level: 'error',
        message: "event pump failed: " + String(error)
      });
    });
  };
  _proto.unsubscribe = function unsubscribe() {
    if (this.timer != null) {
      clearTimeout(this.timer);
      this.timer = undefined;
    }
    this.callbacks = undefined;
    this.subscriptions.forEach(function (subscription) {
      subscription.remove();
    });
    this.subscriptions = [];
  };
  _proto.pump = /*#__PURE__*/function () {
    var _pump = _asyncToGenerator(function* () {
      var _this2 = this;
      if (this.callbacks == null) return;
      var snap = yield RNZcash.poll(this.alias);
      var _this$callbacks = this.callbacks,
        onBalanceChanged = _this$callbacks.onBalanceChanged,
        onStatusChanged = _this$callbacks.onStatusChanged,
        onTransactionsChanged = _this$callbacks.onTransactionsChanged,
        onUpdate = _this$callbacks.onUpdate;
      var event = _extends(_extends({}, snap.balances), {}, {
        availableZatoshi: biggystring.add(biggystring.add(biggystring.add(snap.balances.transparentAvailableZatoshi, snap.balances.saplingAvailableZatoshi), snap.balances.orchardAvailableZatoshi), snap.balances.ironwoodAvailableZatoshi),
        totalZatoshi: biggystring.add(biggystring.add(biggystring.add(snap.balances.transparentTotalZatoshi, snap.balances.saplingTotalZatoshi), snap.balances.orchardTotalZatoshi), snap.balances.ironwoodTotalZatoshi)
      });
      onBalanceChanged(event);
      if (snap.status !== this.lastStatus) {
        this.lastStatus = snap.status;
        onStatusChanged({
          alias: this.alias,
          name: snap.status
        });
      }
      onTransactionsChanged({
        transactions: snap.transactions
      });
      onUpdate({
        alias: this.alias,
        scanProgress: snap.scanProgress,
        networkBlockHeight: snap.networkBlockHeight
      });
      var delay = snap.status === 'SYNCING' ? 500 : 2000;
      this.timer = setTimeout(function () {
        _this2.pump()["catch"](function (error) {
          var _this2$callbacks;
          (_this2$callbacks = _this2.callbacks) == null ? void 0 : _this2$callbacks.onError({
            alias: _this2.alias,
            level: 'error',
            message: "event pump failed: " + String(error)
          });
        });
      }, delay);
    });
    function pump() {
      return _pump.apply(this, arguments);
    }
    return pump;
  }();
  return Synchronizer;
}();
var makeSynchronizer = /*#__PURE__*/function () {
  var _ref2 = _asyncToGenerator(function* (initializerConfig) {
    var synchronizer = new Synchronizer(initializerConfig.alias, initializerConfig.networkName);
    yield synchronizer.initialize(initializerConfig);
    return synchronizer;
  });
  return function makeSynchronizer(_x15) {
    return _ref2.apply(this, arguments);
  };
}();

exports.Synchronizer = Synchronizer;
exports.Tools = Tools;
exports.makeSynchronizer = makeSynchronizer;
//# sourceMappingURL=rnzcash.rn.js.map
