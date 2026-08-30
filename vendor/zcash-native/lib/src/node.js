'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var biggystring = require('biggystring');
var fs = require('fs');
var path = require('path');

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

function candidatePaths() {
  var here = __dirname;
  var platform = process.platform + "-" + process.arch;
  var out = [];
  var dir = here;
  for (var i = 0; i < 6; i++) {
    out.push(path.join(dir, 'prebuilds', platform, 'zcash.node'));
    out.push(path.join(dir, 'rust', 'target', 'release', 'libzcash.dylib'));
    out.push(path.join(dir, 'rust', 'target', 'release', 'libzcash.so'));
    var parent = path.join(dir, '..');
    if (parent === dir) break;
    dir = parent;
  }
  return out;
}
var cached;
function loadNativeAddon() {
  if (cached != null) return cached;
  var errors = [];
  var missing = [];
  for (var _i2 = 0, _candidatePaths2 = candidatePaths(); _i2 < _candidatePaths2.length; _i2++) {
    var candidate = _candidatePaths2[_i2];
    try {
      if (!fs.existsSync(candidate)) {
        missing.push(candidate);
        continue;
      }
      // Native addon loaded at runtime when the .node binary exists.
      var mod = require(candidate);
      if (typeof mod.initialize !== 'function') continue;
      cached = mod;
      return cached;
    } catch (error) {
      var message = error instanceof Error ? error.message : String(error);
      errors.push(candidate + ": " + message);
    }
  }
  throw new Error('zcash-native Node addon not found. Run `npm run build-native-host`. ' + (errors.length > 0 ? errors.join('; ') : "Looked in: " + missing.join(', ')));
}

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
  deriveViewingKey: function deriveViewingKey(seedBytesHex, network) {
    var addon = loadNativeAddon();
    return Promise.resolve(addon.deriveViewingKey(seedBytesHex, network));
  },
  getBirthdayHeight: function () {
    var _getBirthdayHeight = _asyncToGenerator(function* (host, port) {
      var addon = loadNativeAddon();
      return addon.getBirthdayHeight(host, port);
    });
    function getBirthdayHeight(_x, _x2) {
      return _getBirthdayHeight.apply(this, arguments);
    }
    return getBirthdayHeight;
  }(),
  isValidAddress: function isValidAddress(address, network) {
    if (network === void 0) {
      network = 'mainnet';
    }
    var addon = loadNativeAddon();
    return Promise.resolve(addon.isValidAddress(address, network));
  },
  getIronwoodActivationHeight: function getIronwoodActivationHeight(network) {
    if (network === void 0) {
      network = 'mainnet';
    }
    var addon = loadNativeAddon();
    return Promise.resolve(addon.ironwoodActivationHeight(network));
  }
};
var Synchronizer = /*#__PURE__*/function () {
  function Synchronizer(alias, network, addon) {
    this.alias = alias;
    this.network = network;
    this.addon = addon;
  }
  var _proto = Synchronizer.prototype;
  _proto.stop = /*#__PURE__*/function () {
    var _stop = _asyncToGenerator(function* () {
      this.unsubscribe();
      return this.addon.stop(this.alias);
    });
    function stop() {
      return _stop.apply(this, arguments);
    }
    return stop;
  }();
  _proto.initialize = /*#__PURE__*/function () {
    var _initialize = _asyncToGenerator(function* (initializerConfig) {
      yield this.addon.initialize(initializerConfig.mnemonicSeed, initializerConfig.birthdayHeight, initializerConfig.alias, initializerConfig.networkName, initializerConfig.defaultHost, initializerConfig.defaultPort, initializerConfig.newWallet);
    });
    function initialize(_x3) {
      return _initialize.apply(this, arguments);
    }
    return initialize;
  }();
  _proto.deriveUnifiedAddress = /*#__PURE__*/function () {
    var _deriveUnifiedAddress = _asyncToGenerator(function* () {
      return this.addon.deriveUnifiedAddress(this.alias);
    });
    function deriveUnifiedAddress() {
      return _deriveUnifiedAddress.apply(this, arguments);
    }
    return deriveUnifiedAddress;
  }();
  _proto.getLatestNetworkHeight = /*#__PURE__*/function () {
    var _getLatestNetworkHeight = _asyncToGenerator(function* (alias) {
      return this.addon.getLatestNetworkHeight(alias);
    });
    function getLatestNetworkHeight(_x4) {
      return _getLatestNetworkHeight.apply(this, arguments);
    }
    return getLatestNetworkHeight;
  }();
  _proto.rescan = /*#__PURE__*/function () {
    var _rescan = _asyncToGenerator(function* () {
      yield this.addon.rescan(this.alias);
    });
    function rescan() {
      return _rescan.apply(this, arguments);
    }
    return rescan;
  }();
  _proto.proposeOrchardToIronwoodMigration = /*#__PURE__*/function () {
    var _proposeOrchardToIronwoodMigration = _asyncToGenerator(function* () {
      var raw = yield this.addon.proposeOrchardToIronwoodMigration(this.alias);
      return parseJsonObject(raw);
    });
    function proposeOrchardToIronwoodMigration() {
      return _proposeOrchardToIronwoodMigration.apply(this, arguments);
    }
    return proposeOrchardToIronwoodMigration;
  }();
  _proto.proposeTransfer = /*#__PURE__*/function () {
    var _proposeTransfer = _asyncToGenerator(function* (opts) {
      var raw = yield this.addon.proposeTransfer(this.alias, opts.zatoshi, opts.toAddress, opts.memo);
      return parseJsonObject(raw);
    });
    function proposeTransfer(_x5) {
      return _proposeTransfer.apply(this, arguments);
    }
    return proposeTransfer;
  }();
  _proto.proposeFulfillingPaymentURI = /*#__PURE__*/function () {
    var _proposeFulfillingPaymentURI = _asyncToGenerator(function* (paymentUri) {
      var raw = yield this.addon.proposeFulfillingPaymentUri(this.alias, paymentUri);
      return parseJsonObject(raw);
    });
    function proposeFulfillingPaymentURI(_x6) {
      return _proposeFulfillingPaymentURI.apply(this, arguments);
    }
    return proposeFulfillingPaymentURI;
  }();
  _proto.createTransfer = /*#__PURE__*/function () {
    var _createTransfer = _asyncToGenerator(function* (opts) {
      try {
        var raw = yield this.addon.createTransfer(this.alias, opts.proposalBase64, opts.mnemonicSeed);
        return parseJsonObject(raw);
      } catch (error) {
        var errorMessage = error instanceof Error ? error.message : String(error);
        return {
          errorMessage: errorMessage
        };
      }
    });
    function createTransfer(_x7) {
      return _createTransfer.apply(this, arguments);
    }
    return createTransfer;
  }();
  _proto.broadcastTransfer = /*#__PURE__*/function () {
    var _broadcastTransfer = _asyncToGenerator(function* (txid) {
      return this.addon.broadcastTransfer(this.alias, txid);
    });
    function broadcastTransfer(_x8) {
      return _broadcastTransfer.apply(this, arguments);
    }
    return broadcastTransfer;
  }();
  _proto.shieldFunds = /*#__PURE__*/function () {
    var _shieldFunds = _asyncToGenerator(function* (shieldFundsInfo) {
      return this.addon.shieldFunds(this.alias, shieldFundsInfo.seed, shieldFundsInfo.memo, shieldFundsInfo.threshold);
    });
    function shieldFunds(_x9) {
      return _shieldFunds.apply(this, arguments);
    }
    return shieldFunds;
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
  };
  _proto.pump = /*#__PURE__*/function () {
    var _pump = _asyncToGenerator(function* () {
      var _this2 = this;
      if (this.callbacks == null) return;
      var snap = yield this.addon.poll(this.alias);
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
  var _ref = _asyncToGenerator(function* (initializerConfig) {
    var addon = loadNativeAddon();
    var synchronizer = new Synchronizer(initializerConfig.alias, initializerConfig.networkName, addon);
    yield synchronizer.initialize(initializerConfig);
    return synchronizer;
  });
  return function makeSynchronizer(_x10) {
    return _ref.apply(this, arguments);
  };
}();
function makeNodeZcashModule(opts) {
  fs.mkdirSync(opts.documentDirectory, {
    recursive: true
  });
  var addon = loadNativeAddon();
  addon.setDocumentDirectory(opts.documentDirectory);
  return {
    Tools: Tools,
    makeSynchronizer: makeSynchronizer
  };
}

exports.Synchronizer = Synchronizer;
exports.Tools = Tools;
exports.makeNodeZcashModule = makeNodeZcashModule;
exports.makeSynchronizer = makeSynchronizer;
//# sourceMappingURL=node.js.map
