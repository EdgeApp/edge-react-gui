"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadNativeAddon = loadNativeAddon;
const fs_1 = require("fs");
const path_1 = require("path");
function candidatePaths() {
    const here = __dirname;
    const platform = `${process.platform}-${process.arch}`;
    const out = [];
    let dir = here;
    for (let i = 0; i < 6; i++) {
        out.push((0, path_1.join)(dir, 'prebuilds', platform, 'monero.node'));
        out.push((0, path_1.join)(dir, 'build', 'Release', 'monero.node'));
        const parent = (0, path_1.join)(dir, '..');
        if (parent === dir)
            break;
        dir = parent;
    }
    return out;
}
let cached;
function loadNativeAddon() {
    if (cached != null)
        return cached;
    const errors = [];
    const missing = [];
    for (const candidate of candidatePaths()) {
        try {
            if (!(0, fs_1.existsSync)(candidate)) {
                missing.push(candidate);
                continue;
            }
            // Native addon loaded at runtime when the .node binary exists.
            const mod = require(candidate);
            if (typeof mod.callMonero !== 'function')
                continue;
            cached = mod;
            return cached;
        }
        catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            errors.push(`${candidate}: ${message}`);
        }
    }
    throw new Error('monero-native addon not found. Run `npm run build-native-host`. ' +
        (errors.length > 0
            ? errors.join('; ')
            : `Looked in: ${missing.join(', ')}`));
}
