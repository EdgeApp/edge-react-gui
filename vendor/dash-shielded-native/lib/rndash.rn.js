'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

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

var RNDashShielded = reactNative.NativeModules.RNDashShielded;
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
    var _deriveViewingKey = _asyncToGenerator(function* (mnemonicSeed, network) {
      var fullViewingKey = yield RNDashShielded.deriveViewingKey(mnemonicSeed, network);
      return {
        fullViewingKey: fullViewingKey
      };
    });
    function deriveViewingKey(_x, _x2) {
      return _deriveViewingKey.apply(this, arguments);
    }
    return deriveViewingKey;
  }(),
  deriveShieldedAddress: function () {
    var _deriveShieldedAddress = _asyncToGenerator(function* (mnemonicSeed, network, account) {
      if (account === void 0) {
        account = 0;
      }
      return RNDashShielded.deriveShieldedAddressFromSeed(mnemonicSeed, network, account);
    });
    function deriveShieldedAddress(_x3, _x4, _x5) {
      return _deriveShieldedAddress.apply(this, arguments);
    }
    return deriveShieldedAddress;
  }(),
  isValidAddress: function () {
    var _isValidAddress = _asyncToGenerator(function* (address, network) {
      if (network === void 0) {
        network = 'mainnet';
      }
      return RNDashShielded.isValidAddress(address, network);
    });
    function isValidAddress(_x6, _x7) {
      return _isValidAddress.apply(this, arguments);
    }
    return isValidAddress;
  }(),
  warmUpProver: function () {
    var _warmUpProver = _asyncToGenerator(function* () {
      yield RNDashShielded.warmUpProver();
    });
    function warmUpProver() {
      return _warmUpProver.apply(this, arguments);
    }
    return warmUpProver;
  }(),
  isProverReady: function () {
    var _isProverReady = _asyncToGenerator(function* () {
      return RNDashShielded.isProverReady();
    });
    function isProverReady() {
      return _isProverReady.apply(this, arguments);
    }
    return isProverReady;
  }()
};
var Synchronizer = /*#__PURE__*/function () {
  function Synchronizer(alias, network) {
    this.eventEmitter = new reactNative.NativeEventEmitter(RNDashShielded);
    this.subscriptions = [];
    this.alias = alias;
    this.network = network;
  }
  var _proto = Synchronizer.prototype;
  _proto.stop = /*#__PURE__*/function () {
    var _stop = _asyncToGenerator(function* () {
      this.unsubscribe();
      return RNDashShielded.stop(this.alias);
    });
    function stop() {
      return _stop.apply(this, arguments);
    }
    return stop;
  }();
  _proto.initialize = /*#__PURE__*/function () {
    var _initialize = _asyncToGenerator(function* (config) {
      var _config$mnemonicSeed;
      var seed = (_config$mnemonicSeed = config.mnemonicSeed) != null ? _config$mnemonicSeed : config.seedHex;
      if (seed == null) throw new Error('Missing mnemonicSeed');
      yield RNDashShielded.initialize(seed, config.account, config.alias, config.network, config.defaultHost, config.defaultPort);
    });
    function initialize(_x8) {
      return _initialize.apply(this, arguments);
    }
    return initialize;
  }();
  _proto.startSync = /*#__PURE__*/function () {
    var _startSync = _asyncToGenerator(function* () {
      yield RNDashShielded.startSync(this.alias);
    });
    function startSync() {
      return _startSync.apply(this, arguments);
    }
    return startSync;
  }();
  _proto.stopSync = /*#__PURE__*/function () {
    var _stopSync = _asyncToGenerator(function* () {
      yield RNDashShielded.stopSync(this.alias);
    });
    function stopSync() {
      return _stopSync.apply(this, arguments);
    }
    return stopSync;
  }();
  _proto.deriveShieldedAddress = /*#__PURE__*/function () {
    var _deriveShieldedAddress2 = _asyncToGenerator(function* () {
      return RNDashShielded.deriveShieldedAddress(this.alias);
    });
    function deriveShieldedAddress() {
      return _deriveShieldedAddress2.apply(this, arguments);
    }
    return deriveShieldedAddress;
  }();
  _proto.proposeTransfer = /*#__PURE__*/function () {
    var _proposeTransfer = _asyncToGenerator(function* (opts) {
      var result = yield RNDashShielded.proposeTransfer(this.alias, opts.amountCredits, opts.toAddress, opts.memo);
      return parseJsonObject(result);
    });
    function proposeTransfer(_x9) {
      return _proposeTransfer.apply(this, arguments);
    }
    return proposeTransfer;
  }();
  _proto.createTransfer = /*#__PURE__*/function () {
    var _createTransfer = _asyncToGenerator(function* (opts) {
      try {
        var result = yield RNDashShielded.createTransfer(this.alias, opts.proposalId, opts.mnemonicSeed);
        return parseJsonObject(result);
      } catch (error) {
        var errorMessage = error instanceof Error ? error.message : String(error);
        return {
          errorMessage: errorMessage
        };
      }
    });
    function createTransfer(_x0) {
      return _createTransfer.apply(this, arguments);
    }
    return createTransfer;
  }();
  _proto.subscribe = function subscribe(callbacks) {
    var _this = this;
    this.callbacks = callbacks;
    this.pump()["catch"](function (error) {
      callbacks.onError({
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
      var snap = yield RNDashShielded.poll(this.alias);
      var _this$callbacks = this.callbacks,
        onBalanceChanged = _this$callbacks.onBalanceChanged,
        onStatusChanged = _this$callbacks.onStatusChanged,
        onTransactionsChanged = _this$callbacks.onTransactionsChanged,
        onUpdate = _this$callbacks.onUpdate;
      onBalanceChanged({
        availableCredits: snap.availableCredits,
        totalCredits: snap.totalCredits
      });
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
          (_this2$callbacks = _this2.callbacks) == null || _this2$callbacks.onError({
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
  var _ref = _asyncToGenerator(function* (config) {
    var synchronizer = new Synchronizer(config.alias, config.network);
    yield synchronizer.initialize(config);
    return synchronizer;
  });
  return function makeSynchronizer(_x1) {
    return _ref.apply(this, arguments);
  };
}();

exports.Synchronizer = Synchronizer;
exports.Tools = Tools;
exports.makeSynchronizer = makeSynchronizer;
//# sourceMappingURL=rndash.rn.js.map
