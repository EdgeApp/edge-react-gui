"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.networkTypeToIntString = networkTypeToIntString;
const networkTypeMap = {
    MAINNET: 0,
    TESTNET: 1,
    STAGENET: 2
};
function networkTypeToIntString(type) {
    return networkTypeMap[type]?.toString() ?? '0';
}
