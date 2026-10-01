/**
 * Small predicates the engine and the GUI share.
 *
 * Each of these existed in four or five places under two or three names:
 * `isObject`, `isPlainObject` and the body-shape test inside
 * `requireBodyObject` are the same check, and `isMissingFile` was
 * byte-identical in three modules. One copy each, so a change to what counts
 * as "an object" or "an absent file" happens once.
 *
 * In `src/util/` rather than `src/cli/engine/`, because
 * `src/util/exportTxInfo.ts` uses it and that module is reached from
 * `TransactionsExportScene`: the shipped React Native bundle must not import
 * out of the daemon's directory, and it only worked because this file
 * happens to have no imports. It still has none, so nothing is dragged in by
 * using it.
 */

/** An object that is not an array — the shape a JSON body or record has. */
export function isPlainObject(
  value: unknown
): value is Record<string, unknown> {
  return value != null && typeof value === 'object' && !Array.isArray(value)
}

/**
 * A key the object really has, not one it inherits.
 *
 * `map[key] != null` is not that test. Core builds `account.currencyWallets`
 * and `currencyConfig.allTokens` as plain object literals, so
 * `wallets['__proto__']` is `Object.prototype` — truthy — and
 * `allTokens['__proto__'] == null` is false. Every lookup whose key is
 * caller input therefore let `__proto__`, `constructor`, `toString`,
 * `valueOf`, `hasOwnProperty`, `isPrototypeOf`, `propertyIsEnumerable` and
 * `toLocaleString` past the guard that exists to stop them, and the
 * `TypeError` that followed surfaced as `500 INTERNAL_ERROR` with no field
 * name.
 *
 * `Object.prototype.hasOwnProperty.call`, not `Object.hasOwn`: this module
 * is reached from the React Native bundle as well as the daemon.
 */
export function hasOwn(object: object, key: string | number | symbol): boolean {
  return Object.prototype.hasOwnProperty.call(object, key)
}

/**
 * An absent file, as opposed to a failure to read one that is there.
 *
 * Three spellings, because three backends produce it: `ENOENT` from
 * disklet's node backend, `File not found` from its memory backend, and
 * `Cannot load "<path>"` from core's encrypted repo disklet. That last one
 * was missing, and it is the one the engine actually meets — a wallet that
 * has never saved export preferences answered `500 INTERNAL_ERROR` instead
 * of starting a fresh map, so `get-transactions --save-export-prefs` could
 * not succeed on any wallet.
 *
 * The distinction matters in the other direction too: answering a real I/O
 * failure the way an absent file is answered turns one unreadable file into
 * a rewrite of whatever it held.
 */
export function isMissingFile(error: unknown): boolean {
  if (error == null || typeof error !== 'object') return false
  const code = (error as { code?: unknown }).code
  if (code === 'ENOENT') return true
  const message = (error as { message?: unknown }).message
  return (
    typeof message === 'string' &&
    /not found|no such file|cannot load/i.test(message)
  )
}
