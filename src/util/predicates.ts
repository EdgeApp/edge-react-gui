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
 * Two spellings, because two backends produce it: `ENOENT` from disklet's
 * node backend, and `Cannot load "<path>"` from every in-memory backend and
 * from core's encrypted repo disklet. The second was missing, and it is the
 * one the engine actually meets — a wallet that has never saved export
 * preferences answered `500 INTERNAL_ERROR` instead of starting a fresh map,
 * so `get-transactions --save-export-prefs` could not succeed on any wallet.
 *
 * The match set is those two and no more. A third alternative, `not found`,
 * matched nothing any library in the tree emits while reading as an absent
 * file any I/O failure whose message happened to contain the words.
 *
 * That matters most to the callers that answer an absent file by *writing*
 * one: `localAccountSettings.ts` and `CategoriesActions.ts`, whose file is
 * the synced category list a user has built up. A false match there replaces
 * a file that is merely unreadable with the defaults. The rest answer with
 * something the caller can see — `readJsonConfig.ts` returns null,
 * `routes/dataStore.ts` a 404, `routes/admin.ts` a `NOT_FOUND`,
 * `routes/transactions.ts` a 400, `exportTxInfo.ts` a fresh empty map, and
 * `syncedSettingsFile.ts` the cleaner's defaults for a file it never read.
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
    typeof message === 'string' && /no such file|cannot load/i.test(message)
  )
}

/**
 * Whether a failure is about the file's *content* — it will not parse,
 * decrypt or clean — rather than about reading it.
 *
 * Only these may lead to moving or deleting the file. The test used to be
 * the other way round, "a system `code` means I/O", which is Node's shape
 * and not the app's: the React Native disklets cross the bridge as
 * `new Error(message)` with no `code` at all, so on iOS and Android a
 * permission or I/O failure on an intact file reached the delete. Now
 * anything not positively identified as content is rethrown and the file
 * stays. The positives are the parse and cleaner errors (`SyntaxError`,
 * `TypeError`, kept across yaob) and core's own decryption errors.
 */
export function isContentFailure(error: unknown): boolean {
  if (error instanceof SyntaxError || error instanceof TypeError) return true
  const message = error instanceof Error ? error.message : ''
  return /^(Invalid checksum|Invalid PKCS7 padding|Unknown encryption type)$/.test(
    message
  )
}
