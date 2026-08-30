"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FeePriority = exports.asMaybeBusy = exports.ZanoError = void 0;
const cleaners_1 = require("cleaners");
/**
 * An error from the native Zano library, carrying its API return code.
 *
 * The message keeps the exact `<code> <detail>` shape this library has
 * always thrown, so callers matching on `error.message` substrings keep
 * working.
 */
class ZanoError extends Error {
    constructor(rawCode, detail = '') {
        super(`${rawCode} ${detail}`);
        this.name = 'ZanoError';
        // The native layer packs detail into the code itself, as `FAIL:<what>`
        // or `INTERNAL_ERROR, DESCRIPTION: <what>`:
        this.code = rawCode.split(/[\s,:]/)[0];
    }
}
exports.ZanoError = ZanoError;
var WalletState;
(function (WalletState) {
    WalletState[WalletState["SYNCING"] = 1] = "SYNCING";
    WalletState[WalletState["SYNCED"] = 2] = "SYNCED";
    WalletState[WalletState["ERROR"] = 3] = "ERROR";
})(WalletState || (WalletState = {}));
exports.asMaybeBusy = (0, cleaners_1.asMaybe)((0, cleaners_1.asObject)({
    error: (0, cleaners_1.asObject)({
        message: (0, cleaners_1.asValue)('BUSY')
    })
}));
var FeePriority;
(function (FeePriority) {
    FeePriority[FeePriority["DEFAULT"] = 0] = "DEFAULT";
    FeePriority[FeePriority["UNIMPORTANT"] = 1] = "UNIMPORTANT";
    FeePriority[FeePriority["NORMAL"] = 2] = "NORMAL";
    FeePriority[FeePriority["ELEVATED"] = 3] = "ELEVATED";
    FeePriority[FeePriority["PRIORITY"] = 4] = "PRIORITY";
})(FeePriority = exports.FeePriority || (exports.FeePriority = {}));
