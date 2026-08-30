"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.makeNodeZanoModule = void 0;
const fs_1 = require("fs");
const load_addon_1 = require("./load-addon");
/** Directories the Zano SDK expects under documentDirectory. */
const sdkFolders = ['app_config', 'logs', 'wallets'];
/**
 * Node N-API implementation of the native Zano module.
 * Same `callZano` contract as `NativeModules.ZanoModule`.
 */
function makeNodeZanoModule(opts) {
    const addon = (0, load_addon_1.loadNativeAddon)();
    (0, fs_1.mkdirSync)(opts.documentDirectory, { recursive: true });
    for (const name of sdkFolders) {
        (0, fs_1.mkdirSync)(`${opts.documentDirectory}/${name}`, { recursive: true });
    }
    const methodNames = addon.methodNames();
    return {
        callZano: async (name, jsonArguments) => await addon.callZano(name, jsonArguments),
        methodNames,
        documentDirectory: opts.documentDirectory
    };
}
exports.makeNodeZanoModule = makeNodeZanoModule;
