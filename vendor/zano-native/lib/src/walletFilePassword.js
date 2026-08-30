"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deriveWalletFilePassword = void 0;
const rfc4648_1 = require("rfc4648");
const tweetnacl_1 = __importDefault(require("tweetnacl"));
/**
 * Domain separator for the wallet-file password.
 *
 * Changing this value (or anything else about the derivation) orphans every
 * wallet file already encrypted with it, forcing a delete-and-restore. If
 * the derivation must ever change, bump the version suffix and keep the old
 * derivation in `startWallet`'s legacy-password list.
 */
const DOMAIN = 'react-native-zano:file-password:v1';
/**
 * Zano caps wallet-file passwords at 40 characters over a restricted
 * alphabet (`PASSWORD_REGEXP` in Zano core, enforced by `wallet2::generate`).
 * 16 bytes of hex is 32 characters, inside both limits.
 */
const PASSWORD_BYTES = 16;
/**
 * Encodes a string as UTF-8 without relying on Buffer or TextEncoder.
 *
 * This module runs both on the React Native JS thread and inside
 * edge-currency-accountbased's plugin WebView, and `TextEncoder` is not
 * guaranteed in every engine and polyfill combination those present. The
 * derivation must produce identical bytes everywhere, forever, so it does
 * not depend on a host global that may be absent.
 */
function utf8Bytes(text) {
    const out = [];
    for (let i = 0; i < text.length; ++i) {
        let code = text.charCodeAt(i);
        if (code >= 0xd800 && code <= 0xdbff && i + 1 < text.length) {
            // Surrogate pair:
            code = 0x10000 + ((code - 0xd800) << 10) + (text.charCodeAt(++i) - 0xdc00);
        }
        if (code < 0x80) {
            out.push(code);
        }
        else if (code < 0x800) {
            out.push(0xc0 | (code >> 6), 0x80 | (code & 0x3f));
        }
        else if (code < 0x10000) {
            out.push(0xe0 | (code >> 12), 0x80 | ((code >> 6) & 0x3f), 0x80 | (code & 0x3f));
        }
        else {
            out.push(0xf0 | (code >> 18), 0x80 | ((code >> 12) & 0x3f), 0x80 | ((code >> 6) & 0x3f), 0x80 | (code & 0x3f));
        }
    }
    return Uint8Array.from(out);
}
/**
 * Derives the password used to encrypt the wallet file on disk.
 *
 * Versions 0.3.0 and earlier encrypted the file with the seed passphrase,
 * which is the empty string for most wallets, leaving the seed and spend
 * keys effectively unencrypted on disk. The file is a local cache that can
 * always be rebuilt from the mnemonic, so the only requirement here is
 * stability: the same mnemonic must derive the same password on every
 * device, forever.
 *
 * The mnemonic is normalized before hashing because callers store and pass
 * whatever spacing the user or a scanner produced.
 */
function deriveWalletFilePassword(mnemonic) {
    const normalized = mnemonic.trim().replace(/\s+/g, ' ');
    const digest = tweetnacl_1.default.hash(utf8Bytes(`${DOMAIN}|${normalized}`));
    return rfc4648_1.base16.stringify(digest.subarray(0, PASSWORD_BYTES)).toLowerCase();
}
exports.deriveWalletFilePassword = deriveWalletFilePassword;
