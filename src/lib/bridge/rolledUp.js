'use strict';

function _extends() {
  _extends = Object.assign || function (target) {
    for (var i = 1; i < arguments.length; i++) {
      var source = arguments[i];

      for (var key in source) {
        if (Object.prototype.hasOwnProperty.call(source, key)) {
          target[key] = source[key];
        }
      }
    }

    return target;
  };

  return _extends.apply(this, arguments);
}

/**
 * @file
 * Bridgeable objects have a special "magic" property.
 * This file contains routines for working with these magic properties.
 */
// An object is bridgeable if it has this key:
var MAGIC_KEY = '_yaob';
/**
 * Magic data used to mark classes as bridgeable.
 */

var nextLocalId = 1;
var sharedData = {};
/**
 * Adds or updates an object's magic data.
 */

function addMagic(o, magic) {
  if (Object.prototype.hasOwnProperty.call(o, MAGIC_KEY)) {
    _extends(o[MAGIC_KEY], magic);
  } else {
    Object.defineProperty(o, MAGIC_KEY, {
      value: magic
    });
  }
}
/**
 * Makes a class bridgeable, including anything derived from it.
 */


function bridgifyClass(Class) {
  var o = Class.prototype;

  if (!Object.prototype.hasOwnProperty.call(o, MAGIC_KEY)) {
    var magic = {};
    addMagic(o, magic);
  }
}
/**
 * Makes an object instance bridgeable.
 */

function bridgifyObject(o) {
  if (!Object.prototype.hasOwnProperty.call(o, MAGIC_KEY) || o[MAGIC_KEY].localId == null) {
    var magic = {
      localId: nextLocalId++,
      bridges: [],
      listeners: {},
      watchers: {}
    };
    addMagic(o, magic);
  }
}
/**
 * Gets the magic data from an object instance.
 */

function getInstanceMagic(o) {
  // We only want to look at bridgeable objects:
  if (o[MAGIC_KEY] == null) throw new TypeError('Not a bridgeable object');
  bridgifyObject(o);
  return o[MAGIC_KEY];
}
/**
 * Creates a new `ProxyMagic` object.
 */

function makeProxyMagic(remoteId) {
  return {
    // InstanceMagic:
    localId: nextLocalId++,
    bridges: [],
    listeners: {},
    watchers: {},
    // ProxyMagic:
    remoteId: remoteId,
    errors: {},
    props: {}
  };
}
/**
 * Adds items to the global shared data table.
 */

function shareData(table, namespace) {
  if (namespace == null) namespace = '';else namespace += '.';

  for (var _i2 = 0, _Object$getOwnPropert2 = Object.getOwnPropertyNames(table); _i2 < _Object$getOwnPropert2.length; _i2++) {
    var n = _Object$getOwnPropert2[_i2];
    var shareId = namespace + n;

    if (sharedData[shareId] != null) {
      throw new Error("A shared value named " + shareId + " already exists");
    }

    sharedData[shareId] = table[n];
    addMagic(table[n], {
      shareId: shareId
    });
  }
}

/**
 * The data-packing system uses this interface to turn
 * bridgeable objects into packedId's and vice-versa.
 */

// Object properties

/**
 * Prepares a value for sending over the wire.
 */
function packData(table, data) {
  try {
    var map = mapData(table, data);
    var raw = packItem(table, map, data);
    return map !== '' ? {
      map: map,
      raw: raw
    } : {
      raw: raw
    };
  } catch (data) {
    return packThrow(table, data);
  }
}
/**
 * Prepares a thrown value for sending over the wire.
 */

function packThrow(table, data) {
  var map = mapData(table, data);
  var raw = packItem(table, map, data);
  return {
    map: map,
    raw: raw,
    throw: true
  };
}
/**
 * Restores a value that has been sent over the wire.
 */

function unpackData(table, data, path) {
  var map = data.map,
      raw = data.raw;
  var out = map != null ? unpackItem(table, map, raw, path) : raw;
  if (data.throw) throw out;
  return out;
}
/**
 * Searches through a value, looking for data we can't send directly.
 * Returns a map showing where fixes need to take place.
 */

function mapData(table, data) {
  switch (typeof data) {
    case 'boolean':
    case 'number':
    case 'string':
      return '';

    case 'object':
      if (data === null) return '';
      if (data instanceof Date) return 'd';
      if (data instanceof Error) return 'e';

      if (data[MAGIC_KEY] != null) {
        return data[MAGIC_KEY].shareId != null ? 's' : 'o';
      } // Arrays:


      if (Array.isArray(data)) {
        var _out = '';

        for (var i = 0; i < data.length; ++i) {
          var map = mapData(table, data[i]);

          if (map !== '' && _out === '') {
            _out = [];

            for (var j = 0; j < i; ++j) {
              _out[j] = '';
            }
          }

          if (_out !== '') _out[i] = map;
        }

        return _out;
      } // Data objects:


      var out = '';

      for (var n in data) {
        var _map = mapData(table, data[n]);

        if (_map !== '') {
          if (out === '') out = {};
          out[n] = _map;
        }
      }

      return out;

    case 'undefined':
      return 'u';

    case 'function':
      return data[MAGIC_KEY] != null && data[MAGIC_KEY].shareId != null ? 's' : '?';

    default:
      return '?';
  }
}
/**
 * Breaks down an error object into a JSON representation.
 */


function packError(table, o) {
  // Grab the properties off the object:
  var message = o.message,
      stack = o.stack;

  var props = _extends({
    message: message,
    stack: stack
  }, o);

  var base = null;
  if (o instanceof EvalError) base = 'EvalError';else if (o instanceof RangeError) base = 'RangeError';else if (o instanceof ReferenceError) base = 'ReferenceError';else if (o instanceof SyntaxError) base = 'SyntaxError';else if (o instanceof TypeError) base = 'TypeError';else if (o instanceof URIError) base = 'URIError'; // Build the JSON value:

  return _extends({
    base: base
  }, packData(table, props));
}
/**
 * Copies a value, removing any API objects identified in the types.
 */


function packItem(table, map, data) {
  switch (map) {
    case '':
      return data;

    case '?':
      return typeof data;

    case 'd':
      return data.toISOString();

    case 'e':
      return packError(table, data);

    case 'o':
      return table.getPackedId(data);

    case 's':
      return data[MAGIC_KEY].shareId;

    case 'u':
      return null;

    default:
      // Arrays:
      if (Array.isArray(map)) {
        var _out2 = [];

        for (var i = 0; i < map.length; ++i) {
          _out2[i] = packItem(table, map[i], data[i]);
        }

        return _out2;
      } // Objects:


      var out = {};

      for (var n in data) {
        out[n] = n in map ? packItem(table, map[n], data[n]) : data[n];
      }

      return out;
  }
}
/**
 * Restores an error object from its JSON representation.
 */


function unpackError(table, value, path) {
  var bases = {
    EvalError: EvalError,
    RangeError: RangeError,
    ReferenceError: ReferenceError,
    SyntaxError: SyntaxError,
    TypeError: TypeError,
    URIError: URIError // Make the object:

  };
  var Base = value.base != null ? bases[value.base] || Error : Error;
  var out = new Base(); // Restore the properties:

  var props = unpackData(table, value, path);

  for (var n in props) {
    out[n] = props[n];
  }

  return out;
}
/**
 * Restores a value that has been sent over the wire.
 */


function unpackItem(table, map, raw, path) {
  switch (map) {
    case '':
      return raw;

    case '?':
      var type = typeof raw === 'string' ? raw : '?';
      throw new TypeError("Unsupported value of type " + type + " at " + path);

    case 'd':
      return new Date(raw);

    case 'e':
      if (typeof raw !== 'object' || raw === null) {
        throw new TypeError("Expecting an error description at " + path);
      }

      return unpackError(table, raw, path);

    case 'o':
      if (raw === null) {
        throw new TypeError("Closed bridge object at " + path);
      }

      if (typeof raw !== 'number') {
        throw new TypeError("Expecting a packedId at " + path);
      }

      var _o = table.getObject(-raw);

      if (_o == null) throw new RangeError("Invalid packedId " + raw + " at " + path);
      return _o;

    case 's':
      if (typeof raw !== 'string') {
        throw new TypeError("Expecting a shareId at " + path);
      }

      var s = sharedData[raw];
      if (s == null) throw new RangeError("Invalid shareId '" + raw + "' at " + path);
      return s;

    case 'u':
      return void 0;

    default:
      if (typeof map !== 'object' || map === null) {
        throw new TypeError("Invalid type information " + map + " at " + path);
      }

      if (typeof raw !== 'object' || raw === null) {
        throw new TypeError("Expecting an array or object at " + path);
      } // Arrays:


      if (Array.isArray(map)) {
        if (!Array.isArray(raw)) {
          throw new TypeError("Expecting an array at " + path);
        }

        var _out3 = [];

        for (var i = 0; i < map.length; ++i) {
          _out3[i] = unpackItem(table, map[i], raw[i], path + "[" + i + "]");
        }

        return _out3;
      } // Objects:


      var out = {};

      for (var n in raw) {
        out[n] = n in map ? unpackItem(table, map[n], raw[n], path + "." + n) : raw[n];
      }

      return out;
  }
}

/**
 * @file
 * Functions for managing updates, events, and object lifetime.
 */
/**
 * Undoes the effect of `on`.
 */

// No user-supplied value will ever be identical to this.
var dirtyValue = {};
/**
 * Subscribes to an event on a bridgeable object.
 */

function addListener(o, name, f) {
  var _getInstanceMagic = getInstanceMagic(o),
      closed = _getInstanceMagic.closed,
      listeners = _getInstanceMagic.listeners;

  if (closed) return function () {};
  if (listeners[name] == null) listeners[name] = [f];else listeners[name].push(f);
  return function unsubscribe() {
    listeners[name] = listeners[name].filter(function (i) {
      return i !== f;
    });
  };
}
/**
 * Subscribes to property changes on a bridgeable object.
 */

function addWatcher(o, name, f) {
  var _getInstanceMagic2 = getInstanceMagic(o),
      closed = _getInstanceMagic2.closed,
      watchers = _getInstanceMagic2.watchers; // Don't catch access errors, since we want the user to see them:


  var data = o[name];
  if (closed) return function () {};
  if (watchers[name] == null) watchers[name] = {
    data: data,
    fs: [f]
  };else watchers[name].fs.push(f);
  return function unsubscribe() {
    watchers[name].fs = watchers[name].fs.filter(function (i) {
      return i !== f;
    });
  };
}
/**
 * Destroys a proxy.
 * The remote client will completely forget about this object,
 * and accessing it will become an error.
 */

function close(o) {
  var magic = getInstanceMagic(o);
  magic.closed = true;

  for (var _i2 = 0, _magic$bridges2 = magic.bridges; _i2 < _magic$bridges2.length; _i2++) {
    var bridge = _magic$bridges2[_i2];
    bridge.emitClose(magic.localId);
  }

  magic.bridges = [];
  magic.listeners = {};
  magic.watchers = {};
}
/**
 * Emits an event on a bridgeable object.
 */

function emit(o, name, payload) {
  var magic = getInstanceMagic(o);
  if (magic.closed) throw new Error('Cannot emit event on closed object'); // Schedule outgoing event messages:

  for (var _i4 = 0, _magic$bridges4 = magic.bridges; _i4 < _magic$bridges4.length; _i4++) {
    var bridge = _magic$bridges4[_i4];
    bridge.emitEvent(magic.localId, name, payload);
  } // Call local callbacks:


  var listeners = magic.listeners[name];

  if (listeners != null) {
    for (var _i6 = 0; _i6 < listeners.length; _i6++) {
      var _f = listeners[_i6];
      callCallback(o, _f, payload, name !== 'error');
    }
  }
}
/**
 * Marks an object as having changes. The proxy server will send an update.
 */

function update(o, name) {
  var magic = getInstanceMagic(o);
  if (magic.closed) throw new Error('Cannot update closed object');

  for (var _i8 = 0, _magic$bridges6 = magic.bridges; _i8 < _magic$bridges6.length; _i8++) {
    var bridge = _magic$bridges6[_i8];
    bridge.markDirty(magic.localId, name);
  } // Blow away the cache if we have a name:


  if (name != null && magic.watchers[name] != null) {
    magic.watchers[name].data = dirtyValue;
  } // Call watcher callbacks:


  for (var n in magic.watchers) {
    var cache = magic.watchers[n];

    try {
      var data = o[n];

      if (data !== cache.data) {
        cache.data = data;

        for (var _i10 = 0, _cache$fs2 = cache.fs; _i10 < _cache$fs2.length; _i10++) {
          var _f2 = _cache$fs2[_i10];
          callCallback(o, _f2, cache.data, true);
        }
      }
    } catch (e) {}
  }
}
/**
 * Calls a user-supplied callback function with error checking.
 */

function callCallback(o, f, payload, emitError) {
  try {
    var out = f(payload); // If the function returns a promise, emit an error if it rejects:

    if (emitError && out != null && typeof out.then === 'function') {
      out.then(void 0, function (e) {
        return emit(o, 'error', e);
      });
    }
  } catch (e) {
    if (emitError) emit(o, 'error', e);
  }
}

/**
 * @file
 * Routines for breaking bridgeable objects into messages,
 * and then restoring those messages into proxies on the other side.
 */
// No user-supplied value will ever be identical to this.
var dirtyValue$1 = {};
/**
 * Examines a bridgeable object and prepares it for sending of the wire.
 * Returns a creation method an the initial value cache.
 */

function packObject(state, o) {
  // Iterate the prototype chain, looking for property names:
  var allNames = {};
  var end = Object.prototype;

  for (var p = o; p !== end && p != null; p = Object.getPrototypeOf(p)) {
    for (var _i2 = 0, _Object$getOwnPropert2 = Object.getOwnPropertyNames(p); _i2 < _Object$getOwnPropert2.length; _i2++) {
      var _name = _Object$getOwnPropert2[_i2];

      if (_name !== MAGIC_KEY && !/^_/.test(_name) && _name !== 'constructor') {
        allNames[_name] = true;
      }
    }
  } // Iterate over the object's properties and add their names to
  // the method list or the value cache.


  var cache = {};
  var methods = [];
  var props = {};

  for (var n in allNames) {
    try {
      var data = o[n];

      if (typeof data === 'function' && (data[MAGIC_KEY] == null || data[MAGIC_KEY].shareId == null)) {
        methods.push(n);
      } else {
        cache[n] = data;
        props[n] = packData(state, data);
      }
    } catch (e) {
      cache[n] = dirtyValue$1;
      props[n] = packThrow(state, e);
    }
  }

  var _getInstanceMagic = getInstanceMagic(o),
      localId = _getInstanceMagic.localId;

  var create = {
    localId: localId,
    methods: methods,
    props: props
  };
  return {
    cache: cache,
    create: create
  };
}
/**
 * Checks an object for changes.
 * Updates the cache, and returns an object with the necessary changes.
 */

function diffObject(state, o, cache) {
  var dirty = false;
  var props = {};

  for (var n in cache) {
    try {
      var value = o[n];

      if (value !== cache[n]) {
        dirty = true;
        props[n] = packData(state, value);
        cache[n] = value;
      }
    } catch (e) {
      props[n] = packThrow(state, e);
      cache[n] = dirtyValue$1;
    }
  }

  return {
    dirty: dirty,
    props: props
  };
}
/**
 * Creates an object proxy.
 * The object will have the same values and methods as the original,
 * but will send everything over the bridge.
 */

function makeProxy(state, create) {
  var props = {}; // Make the magic property descriptor:

  var magic = makeProxyMagic(create.localId);
  props[MAGIC_KEY] = {
    value: magic // Add the getters:

  };

  for (var n in create.props) {
    props[n] = {
      get: makeProxyGetter(magic, n)
    };
  } // Add the methods:


  for (var _i4 = 0, _create$methods2 = create.methods; _i4 < _create$methods2.length; _i4++) {
    var _n = _create$methods2[_i4];
    props[_n] = {
      value: makeProxyMethod(state, magic, _n)
    };
  } // Make the object:


  return Object.create(Object.prototype, props);
}
/**
 * Unpacks a proxy's properties into the magic storage area.
 */

function updateObjectProps(state, o, props) {
  var magic = o[MAGIC_KEY];

  for (var n in props) {
    try {
      magic.props[n] = unpackData(state, props[n], n);
      magic.errors[n] = false;
    } catch (e) {
      magic.props[n] = e;
      magic.errors[n] = true;
    }
  }
}

function makeProxyGetter(magic, name) {
  return function get() {
    if (magic.errors[name]) throw magic.props[name];
    return magic.props[name];
  };
}

function makeProxyMethod(state, magic, name) {
  return function method() {
    if (magic.closed) {
      return Promise.reject(new TypeError("Cannot call method '" + name + "' of closed proxy"));
    }

    for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    return state.emitCall(magic.remoteId, name, args);
  };
}

var BridgeState =
/*#__PURE__*/
function () {
  // Objects:
  // Outgoing method calls:
  // Pending message:
  // Update scheduling:
  function BridgeState(opts) {
    var sendMessage = opts.sendMessage,
        _opts$throttleMs = opts.throttleMs,
        throttleMs = _opts$throttleMs === void 0 ? 0 : _opts$throttleMs; // Objects:

    this.proxies = {};
    this.objects = {};
    this.caches = {}; // Outgoing method calls:

    this.nextCallId = 0;
    this.pendingCalls = {}; // Pending message:

    this.dirty = {};
    this.message = {}; // Update scheduling:

    this.throttleMs = throttleMs;
    this.lastUpdate = 0;
    this.sendPending = false;
    this.sendMessage = sendMessage;
  }
  /**
   * Grabs an object by its proxy id.
   */


  var _proto = BridgeState.prototype;

  _proto.getObject = function getObject(packedId) {
    return packedId < 0 ? this.proxies[-packedId] : this.objects[packedId];
  };
  /**
   * Returns an object's id relative to this bridge.
   * The id is positive for objects created on this side of the bridge,
   * and negative for proxy objects reflecting things on the other side.
   */


  _proto.getPackedId = function getPackedId(o) {
    var magic = getInstanceMagic(o);
    if (magic.closed) return null;

    if (magic.remoteId != null && this.proxies[magic.remoteId] != null) {
      return -magic.remoteId;
    }

    if (this.objects[magic.localId] == null) {
      // Add unknown objects to the bridge:
      this.objects[magic.localId] = o;

      var _packObject = packObject(this, o),
          cache = _packObject.cache,
          create = _packObject.create;

      this.caches[magic.localId] = cache;
      magic.bridges.push(this);
      this.emitCreate(create, o);
    }

    return magic.localId;
  };
  /**
   * Marks an object as needing changes.
   */


  _proto.markDirty = function markDirty(localId, name) {
    var cache = this.caches[localId];
    if (name != null && name in cache) cache[name] = dirtyValue$1;
    this.dirty[localId] = {
      cache: cache,
      object: this.objects[localId]
    };
    this.wakeup();
  };
  /**
   * Marks an object as being deleted.
   */


  _proto.emitClose = function emitClose(localId) {
    delete this.objects[localId];
    delete this.caches[localId];
    if (this.message.closed == null) this.message.closed = [];
    this.message.closed.push(localId);
    this.wakeup();
  };
  /**
   * Attaches an object to this bridge, sending a creation message.
   */


  _proto.emitCreate = function emitCreate(create, o) {
    if (this.message.created == null) this.message.created = [];
    this.message.created.push(create); // this.wakeup() not needed, since this is part of data packing.
  };
  /**
   * Enqueues a proxy call message.
   */


  _proto.emitCall = function emitCall(remoteId, name, args) {
    var _this = this;

    var callId = this.nextCallId++;

    var message = _extends({
      callId: callId,
      remoteId: remoteId,
      name: name
    }, packData(this, args));

    if (this.message.calls == null) this.message.calls = [];
    this.message.calls.push(message);
    this.wakeup();
    return new Promise(function (resolve, reject) {
      _this.pendingCalls[callId] = {
        resolve: resolve,
        reject: reject
      };
    });
  };
  /**
   * Enqueues an event message.
   */


  _proto.emitEvent = function emitEvent(localId, name, payload) {
    var message = _extends({
      localId: localId,
      name: name
    }, packData(this, payload));

    if (this.message.events == null) this.message.events = [];
    this.message.events.push(message);
    this.wakeup();
  };
  /**
   * Enqueues a function return message.
   */


  _proto.emitReturn = function emitReturn(callId, fail, value) {
    var message = _extends({
      callId: callId
    }, fail ? packThrow(this, value) : packData(this, value));

    if (this.message.returns == null) this.message.returns = [];
    this.message.returns.push(message);
    this.wakeup();
  };
  /**
   * Handles an incoming message,
   * updating state and triggering side-effects as needed.
   */


  _proto.handleMessage = function handleMessage(message) {
    var _this2 = this;

    // ----------------------------------------
    // Phase 1: Get our proxies up to date.
    // ----------------------------------------
    // Handle newly-created objects:
    if (message.created) {
      // Pass 1: Create proxies for the new objects:
      for (var _i2 = 0, _message$created2 = message.created; _i2 < _message$created2.length; _i2++) {
        var create = _message$created2[_i2];
        this.proxies[create.localId] = makeProxy(this, create);
      } // Pass 2: Fill in the values:


      for (var _i4 = 0, _message$created4 = message.created; _i4 < _message$created4.length; _i4++) {
        var _create = _message$created4[_i4];
        updateObjectProps(this, this.proxies[_create.localId], _create.props);
      }
    } // Handle updated objects:


    if (message.changed) {
      // Pass 1: Update all the proxies:
      for (var _i6 = 0, _message$changed2 = message.changed; _i6 < _message$changed2.length; _i6++) {
        var change = _message$changed2[_i6];
        var _localId = change.localId,
            props = change.props;
        var o = this.proxies[_localId];

        if (o == null) {
          throw new RangeError("Invalid localId " + _localId);
        }

        updateObjectProps(this, o, props);
      } // Pass 2: Fire the callbacks:


      for (var _i8 = 0, _message$changed4 = message.changed; _i8 < _message$changed4.length; _i8++) {
        var _change = _message$changed4[_i8];
        update(this.proxies[_change.localId]);
      }
    } // ----------------------------------------
    // Phase 2: Handle events & method calls
    // ----------------------------------------
    // Handle events:


    if (message.events) {
      for (var _i10 = 0, _message$events2 = message.events; _i10 < _message$events2.length; _i10++) {
        var event = _message$events2[_i10];
        var _localId2 = event.localId,
            name = event.name;

        var _o = _localId2 === 0 ? this : this.proxies[_localId2];

        if (_o == null) continue;

        try {
          emit(_o, name, unpackData(this, event, name));
        } catch (e) {
          emit(_o, 'error', e); // Payload unpacking problem
        }
      }
    } // Handle method calls:


    if (message.calls) {
      var _loop = function _loop(_i12, _message$calls2) {
        var call = _message$calls2[_i12];
        var callId = call.callId,
            remoteId = call.remoteId,
            name = call.name;

        try {
          var _o2 = _this2.objects[remoteId];

          if (_o2 == null) {
            throw new TypeError("Cannot call method '" + name + "' of closed proxy (remote)");
          }

          if (typeof _o2[name] !== 'function') {
            throw new TypeError("'" + name + "' is not a function");
          }

          var args = unpackData(_this2, call, name + ".arguments");
          Promise.resolve(_o2[name].apply(_o2, args)).then(function (value) {
            return _this2.emitReturn(callId, false, value);
          }, function (e) {
            return _this2.emitReturn(callId, true, e);
          });
        } catch (e) {
          _this2.emitReturn(callId, true, e);
        }
      };

      for (var _i12 = 0, _message$calls2 = message.calls; _i12 < _message$calls2.length; _i12++) {
        _loop(_i12, _message$calls2);
      }
    } // Handle method returns:


    if (message.returns) {
      for (var _i14 = 0, _message$returns2 = message.returns; _i14 < _message$returns2.length; _i14++) {
        var ret = _message$returns2[_i14];
        var _callId = ret.callId;
        var pendingCall = this.pendingCalls[_callId];

        if (pendingCall == null) {
          throw new RangeError("Invalid callId " + _callId);
        }

        try {
          pendingCall.resolve(unpackData(this, ret, '<return>'));
        } catch (e) {
          pendingCall.reject(e);
        } finally {
          delete this.pendingCalls[_callId];
        }
      }
    } // ----------------------------------------
    // Phase 3: Clean up closed objects
    // ----------------------------------------


    if (message.closed) {
      for (var _i16 = 0, _message$closed2 = message.closed; _i16 < _message$closed2.length; _i16++) {
        var _localId3 = _message$closed2[_i16];
        var _o3 = this.proxies[_localId3];
        if (_o3 == null) return;
        delete this.proxies[_localId3];
        close(_o3);
      }
    }
  };
  /**
   * Sends the current message.
   */


  _proto.sendNow = function sendNow() {
    // Build change messages:
    for (var id in this.dirty) {
      var _localId4 = Number(id);

      var _this$dirty$_localId = this.dirty[_localId4],
          object = _this$dirty$_localId.object,
          cache = _this$dirty$_localId.cache;

      var _diffObject = diffObject(this, object, cache),
          dirty = _diffObject.dirty,
          props = _diffObject.props;

      if (dirty) {
        var _message = {
          localId: _localId4,
          props: props
        };
        if (this.message.changed == null) this.message.changed = [];
        this.message.changed.push(_message);
      }
    }

    var message = this.message;
    this.dirty = {};
    this.message = {};
    this.sendMessage(message);
  };
  /**
   * Something has changed, so prepare to send the pending message:
   */


  _proto.wakeup = function wakeup() {
    var _this3 = this;

    if (this.sendPending) return;
    this.sendPending = true;

    var task = function task() {
      _this3.sendPending = false;
      _this3.lastUpdate = Date.now();

      _this3.sendNow();
    }; // We really do want `setTimeout` here, even if the delay is 0,
    // since promises and other micro tasks should fire first.


    var delay = this.lastUpdate + this.throttleMs - Date.now();
    setTimeout(task, delay < 0 ? 0 : delay);
  };

  return BridgeState;
}();
bridgifyClass(BridgeState);

/**
 * The bridge sends messages using this function.
 */

/**
 * An object bridge.
 */
var Bridge =
/*#__PURE__*/
function () {
  function Bridge(opts) {
    var _this = this;

    this._state = new BridgeState(opts);
    this._rootPromise = new Promise(function (resolve) {
      return addListener(_this._state, 'root', resolve);
    });
  }

  var _proto = Bridge.prototype;

  _proto.handleMessage = function handleMessage(message) {
    this._state.handleMessage(message);
  };

  _proto.getRoot = function getRoot() {
    return this._rootPromise;
  };

  _proto.sendRoot = function sendRoot(root) {
    this._state.emitEvent(0, 'root', root);
  };

  return Bridge;
}();

/**
 * The `on` function,
 * but packaged as a method and ready to be placed on an object.
 */

var onMethod = function on(name, f) {
  return addListener(this, name, f);
};
/**
 * The `watch` function,
 * but packaged as a method and ready to be placed on an object.
 */

var watchMethod = function watch(name, f) {
  return addWatcher(this, name, f);
};
shareData({
  onMethod: onMethod,
  watchMethod: watchMethod
});
/**
 * The base class for all bridgeable API's. Provides callback capability.
 */

var Bridgeable =
/*#__PURE__*/
function () {
  function Bridgeable() {}

  var _proto = Bridgeable.prototype;

  _proto._close = function _close() {
    close(this);
  };

  _proto._emit = function _emit(name, payload) {
    return emit(this, name, payload);
  };

  _proto._update = function _update(name) {
    update(this, name);
  };

  return Bridgeable;
}(); // Put the shared methods onto the prototype:

var hack = Bridgeable.prototype;
hack.on = onMethod;
hack.watch = watchMethod;
bridgifyClass(Bridgeable);

setTimeout(function () {
  window.bridge = new Bridge({
    sendMessage: message => window.postMessage(JSON.stringify(message)),
  });
  window.bridge.getRoot()
    .then(api => {
      window.edgeApi = api;
    });
}, 1000);
