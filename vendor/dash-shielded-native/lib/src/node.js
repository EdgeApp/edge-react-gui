'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

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

function candidatePaths() {
  var here = __dirname;
  var platform = process.platform + "-" + process.arch;
  var out = [];
  var dir = here;
  for (var i = 0; i < 6; i++) {
    out.push(path.join(dir, 'prebuilds', platform, 'dashshielded.node'));
    out.push(path.join(dir, 'rust', 'target', 'release', 'libdashshielded.dylib'));
    out.push(path.join(dir, 'rust', 'target', 'release', 'libdashshielded.so'));
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
      var mod = require(candidate);
      if (typeof mod.initialize !== 'function') continue;
      cached = mod;
      return cached;
    } catch (error) {
      var message = error instanceof Error ? error.message : String(error);
      errors.push(candidate + ": " + message);
    }
  }
  throw new Error('dash-shielded-native Node addon not found. Run `npm run build-native-host`. ' + (errors.length > 0 ? errors.join('; ') : "Looked in: " + missing.join(', ')));
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
  deriveViewingKey: function deriveViewingKey(mnemonicSeed, network) {
    var addon = loadNativeAddon();
    return Promise.resolve({
      fullViewingKey: addon.deriveViewingKey(mnemonicSeed, network)
    });
  },
  deriveShieldedAddress: function () {
    var _deriveShieldedAddress = _asyncToGenerator(function* (mnemonicSeed, network, account) {
      if (account === void 0) {
        account = 0;
      }
      var addon = loadNativeAddon();
      var alias = "tools-addr-" + network + "-" + account;
      yield addon.initialize(mnemonicSeed, account, alias, network, '', 0);
      var _yield$addon$deriveSh = yield addon.deriveShieldedAddress(alias),
        shieldedAddress = _yield$addon$deriveSh.shieldedAddress;
      yield addon.stop(alias);
      return shieldedAddress;
    });
    function deriveShieldedAddress(_x, _x2, _x3) {
      return _deriveShieldedAddress.apply(this, arguments);
    }
    return deriveShieldedAddress;
  }(),
  isValidAddress: function isValidAddress(address, network) {
    if (network === void 0) {
      network = 'mainnet';
    }
    var addon = loadNativeAddon();
    return Promise.resolve(addon.isValidAddress(address, network));
  },
  warmUpProver: function () {
    var _warmUpProver = _asyncToGenerator(function* () {
      var addon = loadNativeAddon();
      yield addon.warmUpProver();
    });
    function warmUpProver() {
      return _warmUpProver.apply(this, arguments);
    }
    return warmUpProver;
  }(),
  isProverReady: function isProverReady() {
    var addon = loadNativeAddon();
    return Promise.resolve(addon.isProverReady());
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
    var _initialize = _asyncToGenerator(function* (config) {
      var _config$mnemonicSeed;
      var seed = (_config$mnemonicSeed = config.mnemonicSeed) != null ? _config$mnemonicSeed : config.seedHex;
      if (seed == null) throw new Error('Missing mnemonicSeed');
      yield this.addon.initialize(seed, config.account, config.alias, config.network, config.defaultHost, config.defaultPort);
    });
    function initialize(_x4) {
      return _initialize.apply(this, arguments);
    }
    return initialize;
  }();
  _proto.startSync = /*#__PURE__*/function () {
    var _startSync = _asyncToGenerator(function* () {
      yield this.addon.startSync(this.alias);
    });
    function startSync() {
      return _startSync.apply(this, arguments);
    }
    return startSync;
  }();
  _proto.stopSync = /*#__PURE__*/function () {
    var _stopSync = _asyncToGenerator(function* () {
      yield this.addon.stopSync(this.alias);
    });
    function stopSync() {
      return _stopSync.apply(this, arguments);
    }
    return stopSync;
  }();
  _proto.deriveShieldedAddress = /*#__PURE__*/function () {
    var _deriveShieldedAddress2 = _asyncToGenerator(function* () {
      return this.addon.deriveShieldedAddress(this.alias);
    });
    function deriveShieldedAddress() {
      return _deriveShieldedAddress2.apply(this, arguments);
    }
    return deriveShieldedAddress;
  }();
  _proto.getBalance = /*#__PURE__*/function () {
    var _getBalance = _asyncToGenerator(function* () {
      var snap = yield this.addon.poll(this.alias);
      return {
        availableCredits: snap.availableCredits,
        totalCredits: snap.totalCredits
      };
    });
    function getBalance() {
      return _getBalance.apply(this, arguments);
    }
    return getBalance;
  }();
  _proto.getTransactions = /*#__PURE__*/function () {
    var _getTransactions = _asyncToGenerator(function* () {
      var snap = yield this.addon.poll(this.alias);
      return snap.transactions;
    });
    function getTransactions() {
      return _getTransactions.apply(this, arguments);
    }
    return getTransactions;
  }();
  _proto.proposeTransfer = /*#__PURE__*/function () {
    var _proposeTransfer = _asyncToGenerator(function* (opts) {
      var raw = yield this.addon.proposeTransfer(this.alias, opts.amountCredits, opts.toAddress, opts.memo);
      return parseJsonObject(raw);
    });
    function proposeTransfer(_x5) {
      return _proposeTransfer.apply(this, arguments);
    }
    return proposeTransfer;
  }();
  _proto.createTransfer = /*#__PURE__*/function () {
    var _createTransfer = _asyncToGenerator(function* (opts) {
      try {
        var raw = yield this.addon.createTransfer(this.alias, opts.proposalId, opts.mnemonicSeed);
        return parseJsonObject(raw);
      } catch (error) {
        var errorMessage = error instanceof Error ? error.message : String(error);
        return {
          errorMessage: errorMessage
        };
      }
    });
    function createTransfer(_x6) {
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
    var addon = loadNativeAddon();
    var synchronizer = new Synchronizer(config.alias, config.network, addon);
    yield synchronizer.initialize(config);
    return synchronizer;
  });
  return function makeSynchronizer(_x7) {
    return _ref.apply(this, arguments);
  };
}();
function makeNodeDashShieldedModule(opts) {
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
exports.makeNodeDashShieldedModule = makeNodeDashShieldedModule;
exports.makeSynchronizer = makeSynchronizer;
//# sourceMappingURL=node.js.map
