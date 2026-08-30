"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.makeNodeMoneroModule = makeNodeMoneroModule;
const events_1 = require("events");
const load_addon_1 = require("./load-addon");
/**
 * Node N-API implementation of the native Monero module.
 * Same `callMonero` contract as `NativeModules.MoneroLwsfModule`.
 */
function makeNodeMoneroModule(opts) {
    const addon = (0, load_addon_1.loadNativeAddon)();
    const emitter = new events_1.EventEmitter();
    addon.setEventListener((walletId, eventName, data) => {
        emitter.emit('MoneroWalletEvent', { walletId, eventName, data });
    });
    const methodNames = addon.methodNames();
    const module = Object.assign(emitter, {
        callMonero: async (name, jsonArguments) => await addon.callMonero(name, jsonArguments),
        methodNames,
        documentDirectory: opts.documentDirectory
    });
    return module;
}
