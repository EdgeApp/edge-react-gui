"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.makeMonero = makeMonero;
const react_native_1 = require("react-native");
const CppBridge_1 = require("./CppBridge");
function makeMonero() {
    const { MoneroLwsfModule } = react_native_1.NativeModules;
    if (MoneroLwsfModule == null) {
        throw new Error('monero-native native module not linked');
    }
    return new CppBridge_1.CppBridge(MoneroLwsfModule);
}
__exportStar(require("./types"), exports);
