/**
 * Response shapes the engine reuses across routes.
 *
 * These describe what a handler returns, and `checkResponse` in `route.ts`
 * runs each response through its route's cleaner on every request. The cleaned
 * value is discarded on purpose: a cleaner strips unknown keys, so returning it
 * would delete fields a plugin adds. The check reports drift and never
 * reshapes. `EDGE_CLI_CHECK_RESPONSES` chooses what a mismatch costs — `warn`
 * (the default) logs it, `strict` fails the request, `off` skips the check.
 *
 * Request cleaners live beside their route. They use `.withRest` so declared
 * fields are validated while anything a handler forwards wholesale to core
 * still passes through untouched.
 */
import type { Cleaner } from 'cleaners'
import {
  asArray,
  asBoolean,
  asDate,
  asEither,
  asNull,
  asNumber,
  asObject,
  asOptional,
  asString,
  asUnknown,
  asValue
} from 'cleaners'
import type {
  EdgeAssetAction,
  EdgeAssetActionType,
  EdgeMemo,
  EdgeMetadata,
  EdgeMetadataChange,
  EdgeTxAction
} from 'edge-core-js'

import { asBiggystring } from '../../util/cleaners'
import { hasOwn } from '../../util/predicates'
import { MAX_TIMER_MS } from '../timerCeiling'
import { doc } from './doc'
import {
  OBJECT_EXPIRES_DOC,
  OBJECT_ID_DOC,
  OBJECT_KIND_DOC,
  SPEND_AMOUNT_ALIAS_DOC,
  SPEND_AMOUNT_DOC,
  SPEND_METADATA_DOC,
  SPEND_TO_DOC,
  TOKEN_ID_DOC,
  WALLET_ID_DOC
} from './fieldDocs'

/**
 * A cleaned object with the keys the caller never sent removed.
 *
 * `asObject` materialises every declared key, so cleaning `{ notes: 'x' }`
 * against a five-field cleaner yields an object that *has* `name`,
 * `category`, `bizId` and `exchangeAmount`, each `undefined`. Spread over an
 * existing value — which is how both of this engine's merges work, and how
 * core's `changeWalletStates` works — those copy over the real fields and
 * blank them.
 *
 * Found twice: `change-wallet-states` wiping a wallet's `hidden` flag and
 * `sortIndex` out of the account's synced repo, and `--metadata` blanking a
 * transaction's payee, category and bizId. `JSON.stringify` hides it both
 * times, because it omits `undefined` values, so the cleaned object prints
 * exactly as the caller sent it.
 *
 * A caller cannot send `undefined` over JSON — the key is absent, or it is
 * `null` and the cleaner decides — so "present and `undefined`" means
 * exactly "not named".
 */
export function withoutUndefined<T extends object>(value: T): Partial<T> {
  const out: Partial<T> = {}
  for (const [key, inner] of Object.entries(value)) {
    if (inner !== undefined) out[key as keyof T] = inner as T[keyof T]
  }
  return out
}

/** `EdgeTokenId`: a contract id, or null for the native asset. */
export const asTokenId = asEither(asString, asValue(null))

/** A string with something in it. */
const asNonEmptyString: Cleaner<string> = raw => {
  const value = asString(raw)
  if (value === '') throw new TypeError('Expected a non-empty string')
  return value
}

/**
 * The wallet a call acts on.
 *
 * Not a path parameter. A wallet id is base64 — `7o7i6/tlI+qi…=` is an
 * ordinary one — and a value containing `/` cannot be a path segment without
 * percent-encoding that callers forget. Path parameters are reserved for
 * base58 identifiers, which have no such character.
 */
export const asWalletId = doc(
  // Non-empty, because `findWallet` resolves a prefix: `''` is a prefix of
  // every wallet, so on a single-wallet account a dropped field used to
  // resolve silently to that one wallet — and that reaches `spend`.
  asNonEmptyString,
  WALLET_ID_DOC
)

// ------------------------------------------------------------ query values
// A query string carries only text, so `?saveExportPrefs=true` arrives as
// the four characters "true". (`paused` is a *body* field on `change-paused`,
// where it is a plain `asBoolean` and no coercion happens, so it is the
// opposite of the lesson here.) These cleaners convert on the way in, which lets a route
// declare the type it actually means: the documented type, the type the
// handler reads, and the CLI flag kind all follow from one declaration. A
// route that declared `asString` and converted inside the handler documented a
// string and produced a `--flag=<value>` where a bare switch belonged.

/** A boolean written out in a query string. */
export const asQueryBoolean: Cleaner<boolean> = raw => {
  if (typeof raw === 'boolean') return raw
  if (raw === 'true') return true
  if (raw === 'false') return false
  throw new TypeError('Expected "true" or "false"')
}

/** A whole number written out in a query string. */
export const asQueryInteger: Cleaner<number> = raw => {
  if (typeof raw === 'number' && Number.isInteger(raw)) return raw
  if (typeof raw !== 'string' || raw === '') {
    throw new TypeError('Expected a whole number')
  }
  const parsed = Number(raw)
  if (!Number.isInteger(parsed)) {
    throw new TypeError('Expected a whole number')
  }
  return parsed
}

/**
 * A whole number that cannot be negative, for a field that indexes.
 *
 * `limit`, `offset` and `forceIndex` all reach an array index or a
 * derivation index, and `asQueryInteger` accepted a negative one:
 * `?limit=-5` reached `slice(0, -5)`, so the engine returned every
 * transaction but the last five while `total` still reported the full count —
 * a pager got wrong data with no error — and `?offset=-5` returned the last
 * five. Neither is a documented meaning; `0` is already the "everything"
 * opt-out.
 */
export const asQueryNonNegativeInteger: Cleaner<number> = raw => {
  const parsed = asQueryInteger(raw)
  if (parsed < 0) {
    throw new TypeError('Expected zero or a whole positive number')
  }
  return parsed
}

/**
 * A positive decimal string, as biggystring parses one.
 *
 * `asString` let `"abc"`, `""` and `"-1"` through to biggystring: the first
 * came back as a plain `Error` and therefore `500 INTERNAL_ERROR` on a route
 * that declares `BAD_REQUEST`, and the other two produced a silently wrong
 * `nativeAmount` under a field documented as what a spend actually takes.
 * `asBiggystring` already rejects blank, hex, exponential, `Infinity` and
 * `NaN`; this adds the sign and zero test those fields need.
 */
export const asPositiveBiggystring: Cleaner<string> = raw => {
  const value = asBiggystring(raw)
  if (value.startsWith('-') || /^0(?:\.0+)?$/.test(value)) {
    throw new TypeError(`"${value}" is not a positive number`)
  }
  return value
}

/**
 * A number in a JSON request *body*, accepting the string form.
 *
 * `kindOf` resolves a body field to `kind: 'string'` unless its cleaner is a
 * structured one, and the CLI then puts the raw flag text into the body: so
 * `enable-otp --timeout=604800` sent `{"timeout":"604800"}` into
 * `asOptional(asNumber)` and the command could never succeed —
 * `BAD_REQUEST: Expected a number, got "604800" at .timeout`. The query side
 * already solved this with `asQueryInteger`; this is the body-side twin, and
 * `routeBodyKinds.test.ts` asserts no `kind: 'string'` body field is left
 * with a cleaner that refuses a string.
 */
export const asBodyNumber: Cleaner<number> = raw => {
  if (typeof raw === 'number' && Number.isFinite(raw)) return raw
  if (typeof raw !== 'string' || raw.trim() === '') {
    throw new TypeError('Expected a number')
  }
  const parsed = Number(raw)
  if (!Number.isFinite(parsed)) throw new TypeError('Expected a number')
  return parsed
}

/**
 * A duration in seconds with a floor.
 *
 * A poll interval with no floor is a request flood: `0` runs as fast as the
 * network answers, and the caller who wrote it meant seconds.
 */
export const asMinSeconds =
  (min: number): Cleaner<number> =>
  raw => {
    const seconds = asBodyNumber(raw)
    if (seconds < min) {
      throw new TypeError(`Expected at least ${min} seconds`)
    }
    if (seconds * 1000 > MAX_TIMER_MS) {
      throw new TypeError(
        `Expected at most ${Math.floor(MAX_TIMER_MS / 1000)} seconds`
      )
    }
    return seconds
  }

export { MAX_TIMER_MS }

const EXPECTED_DATE =
  'Expected an ISO-8601 date (2024-01-31, 2024-01-31T00:00:00.000Z, 20240131 or 2024) or epoch milliseconds (at least 12 digits)'

/**
 * A date written out in a query string, as ISO-8601 or epoch milliseconds.
 *
 * `Number(raw)` first was the whole problem: it made *any* all-digit string
 * epoch milliseconds, and ISO-8601 admits all-digit forms. `--date=2024`
 * became `1970-01-01T00:00:02.024Z` where `new Date('2024')` is
 * `2024-01-01`, and `--start-date=20240101` became
 * `1970-01-01T05:37:20.101Z`. No `BAD_REQUEST` — which is what this field's
 * documentation promises for a date it cannot read — just a silently empty
 * or wrong export window, or a 1970 price in a file someone files taxes
 * from.
 *
 * So an all-digit string is epoch milliseconds only when it is long enough
 * to be one. Twelve digits is March 1973 onwards and thirteen is September
 * 2001 onwards, which covers every timestamp an account can have. Ten and
 * eleven digits are refused: as milliseconds they are January to April
 * 1970, and a ten-digit value is almost always epoch *seconds* —
 * `1706659200` is 2024-01-31 — which read as milliseconds is
 * `1970-01-20`, the silently wrong window this cleaner exists to stop.
 *
 * The two ISO basic forms are spelled out because `Date` does not take them
 * as written: `new Date('20240101')` is `Invalid Date`, and `new
 * Date('202401')` is the year *202401*. `2024` it does read, as
 * `2024-01-01`, and it is normalised here anyway so the three agree.
 */
export const asQueryDate: Cleaner<Date> = raw => {
  if (raw instanceof Date) return raw
  if (typeof raw !== 'string' || raw.trim() === '') {
    throw new TypeError(EXPECTED_DATE)
  }
  const text = raw.trim()
  let date: Date
  if (/^-?\d+$/.test(text)) {
    const digits = text.replace('-', '')
    if (digits.length >= 12) {
      date = new Date(Number(text))
    } else if (digits.length >= 10) {
      throw new TypeError(
        `${EXPECTED_DATE}. "${text}" looks like epoch seconds; multiply by 1000 for milliseconds`
      )
    } else if (/^\d{8}$/.test(text)) {
      // ISO basic calendar date, which `Date` rejects as written.
      date = new Date(
        `${text.slice(0, 4)}-${text.slice(4, 6)}-${text.slice(
          6,
          8
        )}T00:00:00.000Z`
      )
    } else if (/^\d{4}$/.test(text)) {
      // ISO calendar year: the start of it, in UTC.
      date = new Date(`${text}-01-01T00:00:00.000Z`)
    } else {
      // Neither: too short for milliseconds, and not a form ISO-8601 has.
      // `202401` is the loudest case — `Date` reads it as the year 202401.
      throw new TypeError(EXPECTED_DATE)
    }
  } else {
    date = new Date(text)
  }
  if (Number.isNaN(date.getTime())) {
    throw new TypeError(EXPECTED_DATE)
  }
  return date
}

/**
 * `EdgeTokenId` in request position.
 *
 * The native asset is `null`, which a query string can only spell as the text
 * "null" — and the CLI sends every tokenId as a string, body or query alike —
 * so both that text and a real `null` mean the native asset. `asTokenId` is
 * the response-position cleaner and deliberately does *not* do this: a
 * tokenId core hands back is already the right shape, and reading `"null"`
 * there would be guessing.
 *
 * `''` cannot reach a cleaner: `queryToObject` reads an empty query value as
 * an absent parameter, and `asOptional` intercepts nullish before this runs.
 */
export const asRequestTokenId: Cleaner<string | null> = raw => {
  if (raw === null || raw === 'null') return null
  if (typeof raw === 'string') return raw
  throw new TypeError('Expected a token id or null')
}

/** A core value passed through untouched. Documented by name in JSDoc. */
export const asCoreValue = asUnknown

export const asVoid = asValue(undefined)

/** A bare acknowledgement. */
export const asOk = asObject({
  ok: doc(asBoolean, 'Always true; a failure arrives as an error envelope.')
})

/** An acknowledgement naming the handle the call consumed. */
export const asOkObject = asObject({
  ok: doc(asBoolean, 'Always true; a failure arrives as an error envelope.'),
  objectId: doc(asString, 'The handle this call consumed. It is now expired.')
})

export const asLoginMethod = asValue(
  'password',
  'pin',
  'key',
  'recovery',
  'edge',
  'create'
)

/** Returned by every successful login and by keepalive. */
export const asSession = asObject({
  sessionId: doc(
    asString,
    'Identifies this login. Every account-scoped call carries it, and the ' +
      'CLI stores the most recent one so commands can omit it.'
  ),
  username: doc(
    asOptional(asString),
    'Absent for a light account, which has no username.'
  ),
  rootLoginId: doc(
    asString,
    'The account root, stable across appIds. Two sessions sharing it are the ' +
      'same account.'
  ),
  loginMethod: doc(asLoginMethod, 'How this session was established.'),
  autoLogoutSeconds: doc(
    asNumber,
    'Idle time before the engine logs the account out. 0 disables it.'
  ),
  autoLogoutRead: doc(
    asBoolean,
    'False when the account\u2019s `Settings.json` could not be read, so `autoLogoutSeconds` is the default (3600) rather than the account\u2019s choice. The engine reads the file again on every sweep.'
  ),
  expiresAt: doc(
    asEither(asString, asValue(null)),
    'When auto-logout will fire, or null when it is disabled.'
  ),
  lastActivityAt: doc(
    asString,
    'Last call on this session, which is what auto-logout measures from.'
  ),
  createdAt: doc(asString, 'When the login completed.')
})

/**
 * Returned by `engine-sessions`, whose `sessionId` is truncated.
 *
 * The listing needs no session of its own, so publishing usable ids made one
 * unauthenticated call a credential dispenser. Same shape otherwise, built
 * from `asSession` so the two cannot drift.
 */
export const asSessionListing = asObject({
  ...asSession.shape,
  sessionId: doc(
    asString,
    'The first ten characters of the session id, followed by an ellipsis. ' +
      'This listing is a diagnostic: a session id is a bearer token, and a ' +
      'caller entitled to one already has it from its own login response.'
  )
})

/** One currency wallet. `walletId` and `id` are the same value. */
export const asWalletSummary = asObject({
  walletId: doc(
    asString,
    'The full wallet id. Commands taking a wallet accept any unique prefix.'
  ),
  id: doc(
    asString,
    'Same value as `walletId`, under the name `edge-core-js` uses. Core\u2019s `EdgeCurrencyWallet` has only `id`; `walletId` is the name every route\u2019s parameter takes, so both are published and a caller can use whichever half of the API it is reading.'
  ),
  type: doc(asString, 'Key type, such as `wallet:bitcoin`.'),
  name: doc(
    asEither(asString, asValue(null)),
    'User-assigned name, null until one is set.'
  ),
  pluginId: doc(asString, 'Currency plugin backing this wallet.'),
  currencyCode: doc(asString, 'Ticker for the native asset.'),
  fiatCurrencyCode: doc(
    asString,
    'Fiat the wallet reports value in, as `iso:USD`.'
  ),
  blockHeight: doc(asNumber, 'Chain height this wallet has seen.'),
  syncStatus: doc(asCoreValue, '`EdgeWalletSyncStatus` from core.'),
  syncRatio: doc(
    asOptional(asString),
    'Sync progress as a percentage, for display.'
  ),
  paused: doc(asBoolean, 'True while the engine is not syncing this wallet.'),
  imported: doc(
    asOptional(asBoolean),
    'True when the keys came from an import rather than being generated here.'
  ),
  created: doc(
    asEither(asString, asValue(null)),
    'When the wallet was created, null for wallets predating the field.'
  ),
  enabledTokenIds: doc(asArray(asString), 'Tokens the user turned on.'),
  detectedTokenIds: doc(
    asArray(asString),
    'Tokens found on-chain that are not enabled yet.'
  ),
  unactivatedTokenIds: doc(
    asArray(asString),
    'Enabled tokens still awaiting on-chain activation.'
  )
})

/** One asset balance, with the display amount already divided out. */
export const asBalance = asObject({
  tokenId: doc(asTokenId, 'The asset, or null for the chain\u2019s own coin.'),
  currencyCode: doc(asString, 'Ticker for this asset.'),
  nativeAmount: doc(
    asString,
    'The balance in the smallest unit, as a decimal string.'
  ),
  displayAmount: doc(
    asEither(asString, asNull),
    'The same balance divided by the display multiplier, or null for a token whose config the plugin no longer carries — there is no denomination to divide by.'
  ),
  unknownToken: doc(
    asBoolean,
    'True when the plugin reports a balance for a token it has no config for, so `displayAmount` and `currencyCode` cannot be resolved.'
  )
})

/**
 * The fields every handle answer carries, shared by the shapes below.
 *
 * A plain object rather than a second cleaner, so each consumer can spread
 * it and add or narrow a field without restating the others' prose. It had
 * one consumer while `asTransactionHandle` below restated five of its six
 * fields — the same cleaners, down to the identical sentences — and
 * `ObjectHandleInfo` in `objectHandles.ts` was a third hand-written copy of
 * the same six. All three come from here now, which is what the comment
 * claimed before it was true.
 */
const OBJECT_HANDLE_SHAPE = {
  objectId: doc(asString, OBJECT_ID_DOC),
  kind: doc(
    asValue('transaction', 'pendingLogin', 'swap', 'lobby'),
    OBJECT_KIND_DOC
  ),
  createdAt: doc(asString, 'When the engine took the handle.'),
  expiresAt: doc(asString, OBJECT_EXPIRES_DOC),
  sessionId: doc(
    asOptional(asString),
    'Session that created the handle; only that session may use it.'
  ),
  walletId: doc(
    asOptional(asString),
    'Wallet the handle is bound to, when it belongs to one.'
  )
}

/**
 * What `object-get` answers: the handle fields plus the projected value.
 *
 * `getObject`'s handler has always returned `value`, and its `returns` prose
 * spends a sentence on the three per-kind shapes — but it declared a handle
 * cleaner with no such field, so the published 200 schema
 * omitted the one thing the route exists to return and a generated client
 * dropped the payload. Nothing caught it: `asObject` ignores extra keys, so
 * the response check is silent even in `strict`, and the router discards the
 * cleaned value, so the field is still sent at runtime.
 *
 * `asUnknown` because the shape depends on `kind`: a whole `EdgeTransaction`,
 * a five-field summary of a swap quote, or null.
 */
export const asInspectedHandle = asObject({
  ...OBJECT_HANDLE_SHAPE,
  value: doc(
    asUnknown,
    'A JSON-safe view of the object, whose shape depends on `kind`: a staged transaction whole, a swap quote summarised, and null for a kind with no scalar projection.'
  )
})

/**
 * The handle fields on their own, which is what the store answers with.
 *
 * `ObjectHandleInfo` is this type, so the interface and the published
 * declaration cannot describe different objects.
 */
export const asObjectHandleInfo = asObject(OBJECT_HANDLE_SHAPE)

/**
 * An object handle carrying the transaction it refers to.
 *
 * The shared shape with `kind` narrowed to this one. `createdAt` arrives
 * with it: `txHandleResponse` spreads the whole `ObjectHandleInfo`, so the
 * field was always sent and only the declaration left it out.
 */
export const asTransactionHandle = asObject({
  ...OBJECT_HANDLE_SHAPE,
  kind: doc(asValue('transaction'), OBJECT_KIND_DOC),
  transaction: doc(
    asCoreValue,
    '`EdgeTransaction` as it stands after this step. Unsigned after ' +
      '`make-spend`, signed after `sign-tx`, and carrying a txid once broadcast.'
  )
})

/** A swap quote, held under a `swap_` handle with a 5 minute TTL. */
export const asSwapQuote = asObject({
  objectId: doc(asString, OBJECT_ID_DOC),
  kind: doc(asValue('swap'), OBJECT_KIND_DOC),
  expiresAt: doc(asString, OBJECT_EXPIRES_DOC),
  pluginId: doc(asString, 'Swap provider that produced this quote.'),
  isEstimate: doc(
    asBoolean,
    'True when the provider may settle at a different rate than quoted.'
  ),
  canBePartial: doc(
    asEither(asBoolean, asValue(null)),
    'True when the provider may fill only part of the order. Null when it ' +
      'does not say.'
  ),
  maxFulfillmentSeconds: doc(
    asEither(asNumber, asValue(null)),
    'Longest the provider expects a partial fill to take.'
  ),
  minReceiveAmount: doc(
    asEither(asString, asValue(null)),
    'Least the provider guarantees to deliver, in the destination\u2019s ' +
      'native units.'
  ),
  fromNativeAmount: doc(asString, 'Amount leaving the source wallet.'),
  toNativeAmount: doc(asString, 'Amount arriving in the destination wallet.'),
  networkFee: doc(
    asObject({ nativeAmount: asString, tokenId: asTokenId }),
    'On-chain fee for the sending transaction. It is not the provider\u2019s ' +
      'own spread, which is already in the rate.'
  ),
  quoteExpirationDate: doc(
    asEither(asString, asValue(null)),
    'When the provider stops honouring the rate. Null when it does not expire.'
  ),
  swapInfo: doc(
    asObject({
      pluginId: asString,
      displayName: asString,
      supportEmail: asString,
      isDex: asEither(asBoolean, asValue(null))
    }),
    '`EdgeSwapInfo`: how to name the provider and where to send complaints.'
  ),
  request: doc(
    asObject({
      fromTokenId: asTokenId,
      toTokenId: asTokenId,
      nativeAmount: asString,
      quoteFor: asValue('from', 'to', 'max'),
      fromWalletId: asString,
      toWalletId: asString
    }),
    'The `EdgeSwapRequest` this quote answers, echoed back so quotes from ' +
      'different plugins can be compared without tracking what was asked.'
  )
})

/** A QR / lobby login in progress. `session` fills once `state` is `done`. */
export const asPendingEdgeLogin = asObject({
  objectId: doc(asString, OBJECT_ID_DOC),
  pendingId: doc(
    asString,
    'Same value as `objectId`, under the name the poll command takes.'
  ),
  kind: doc(asValue('pendingLogin'), OBJECT_KIND_DOC),
  expiresAt: doc(
    asEither(asString, asValue(null)),
    'When the lobby closes and the QR code stops working.'
  ),
  lobbyId: doc(asString, 'Lobby the phone connects to.'),
  uri: doc(
    asString,
    'The `edge://` URI to render as a QR code for the phone to scan.'
  ),
  state: doc(
    asValue('pending', 'started', 'done', 'error', 'closed'),
    'How far the login has got: `pending` before the phone scans, `started` ' +
      'once it has, and `done` when `session` is filled in.'
  ),
  username: doc(
    asEither(asString, asValue(null)),
    'Account that approved the login, known once the phone has scanned.'
  ),
  session: doc(
    asEither(asSession, asValue(null)),
    'The session, null until `state` is `done`.'
  ),
  error: doc(
    asEither(asString, asValue(null)),
    'Why the login failed, set only when `state` is `error`.'
  )
})

/** The enabled token set after a change. */
export const asEnabledTokens = asObject({
  enabledTokenIds: doc(
    asArray(asString),
    'The wallet\u2019s enabled tokens after the change, not just what changed.'
  )
})

/*
 * The error envelope has no cleaner here, deliberately.
 *
 * Every other published shape is a cleaner in this file, because the
 * generator reads the route declarations. The envelope is not attached to a
 * route — it is the response of *every* route's failure — so
 * `scripts/buildApiDocs.ts` writes `components.schemas.ErrorEnvelope` from
 * the code catalogue instead.
 *
 * The runtime shape lives in `errors.ts`, beside `toErrorBody` which writes
 * it: `asErrorBody` is the cleaner, `ErrorResponse` derives its fields from
 * it, and the client imports the same cleaner to read the envelope back. A
 * declaration lived here too, exported and referenced by nothing, which read
 * as the source of truth for a document it had no part in generating.
 */

// `asDate` is re-exported so route files can describe date fields without
// each importing it from `cleaners` directly.
export { asDate }

// ---------------------------------------------------------------------------
// Persisted shapes
//
// These three go into the wallet's synced transaction file, and core does not
// validate them between an HTTP body and the disklet. Both failure modes are
// silent. A non-object `metadata` merges nothing, because `mergeMetadata`
// only reads properties off its argument, so the route answers 204 having
// written nothing. An object with a wrong field type is dispatched to the
// in-memory transaction *before* `transactionFile.save` runs its own cleaner
// and throws, so the engine serves metadata that disk does not have for the
// life of the daemon, and the caller gets a 500 from core where the route
// declares BAD_REQUEST.
// ---------------------------------------------------------------------------

/**
 * Refuse an array where an object is meant.
 *
 * `asObject` accepts one, because an array *is* an object in JS — and for a
 * value that core merges field by field that is the silent case:
 * `mergeMetadata` reads no properties off `[]`, so the route answered 204
 * having written nothing.
 */
function asNotArray<T>(cleaner: Cleaner<T>): Cleaner<T> {
  return raw => {
    if (Array.isArray(raw)) {
      throw new TypeError('Expected an object, got an array')
    }
    return cleaner(raw)
  }
}

/**
 * Optional in the `EdgeMetadataChange` sense, where `undefined` leaves a field
 * alone and `null` deletes it.
 *
 * `asOptional` cannot express this: it maps *both* to its fallback, so a
 * `{"notes": null}` would have reached core as `{}` and silently stopped
 * deleting the note.
 */
function asChange<T>(cleaner: Cleaner<T>): Cleaner<T | null | undefined> {
  return raw => {
    if (raw === undefined) return undefined
    if (raw === null) return null
    return cleaner(raw)
  }
}

/** `null` deletes a saved value; an absent field leaves it unchanged. */
export const asEdgeMetadataChange: Cleaner<EdgeMetadataChange> = asNotArray(
  asObject({
    bizId: asChange(asNumber),
    category: asChange(asString),
    exchangeAmount: asOptional(asObject(asEither(asNumber, asNull))),
    name: asChange(asString),
    notes: asChange(asString)
  })
)

/** `EdgeMetadata`, for the write paths that do not accept a deletion. */
export const asEdgeMetadata: Cleaner<EdgeMetadata> = asNotArray(
  asObject({
    bizId: asOptional(asNumber),
    category: asOptional(asString),
    exchangeAmount: asOptional(asObject(asNumber)),
    name: asOptional(asString),
    notes: asOptional(asString)
  })
)

/**
 * Native units as core stores them: digits only.
 *
 * The cleaner for every `nativeAmount`, `amount` or threshold a *caller*
 * sends. Response-position amounts stay `asString`: a transaction's
 * `nativeAmount` is negative for a send, and core's own values are already
 * valid, so tightening those would reject legitimate output.
 *
 * `asString` here was the one field across the `asEdgeTxAction*` cleaners
 * looser than core's own, and it re-opened the hole those cleaners exist to
 * close. `save-tx-action` with `"nativeAmount":"1.5"` passed this route,
 * then core dispatched `CURRENCY_WALLET_FILE_CHANGED` *before* awaiting the
 * file save, whose `uncleaner(asTransactionFile)` rejected it — so the
 * engine served a `savedAction` the disk did not have for the life of the
 * daemon, and the caller got a 500 on a route declaring only 400 and 404.
 */
export const asIntegerString: Cleaner<string> = raw => {
  const value = asString(raw)
  if (!/^\d+$/.test(value)) {
    throw new TypeError(`"${value}" is not an integer string`)
  }
  return value
}

const asEdgeAssetAmount = asObject({
  pluginId: asString,
  tokenId: asEither(asString, asNull),
  nativeAmount: asOptional(asIntegerString)
})

const asEdgeFiatAmount = asObject({
  fiatCurrencyCode: asString,
  fiatAmount: asString
})

/**
 * Every `EdgeAssetActionType`, as a list a compiler can check.
 *
 * `asValue<EdgeAssetActionType[]>(…)` checks assignability, not
 * exhaustiveness, so a member core adds would be refused at runtime by
 * `save-tx-action` instead of failing to compile — and `checkCoreAlignment`
 * compares method signatures, never a union's members, so no gate covers it.
 * `ASSET_ACTION_TYPES_EXHAUSTIVE` below is the check: it stops compiling the
 * moment core's union has a member this list does not.
 */
const ASSET_ACTION_TYPES = [
  'claim',
  'claimOrder',
  'stake',
  'stakeNetworkFee',
  'stakeOrder',
  'unstake',
  'unstakeNetworkFee',
  'unstakeOrder',
  'swap',
  'swapNetworkFee',
  'swapOrderPost',
  'swapOrderFill',
  'swapOrderCancel',
  'buy',
  'sell',
  'sellNetworkFee',
  'tokenApproval',
  'transfer',
  'transferNetworkFee',
  'giftCard'
] as const

/**
 * `never` unless `ASSET_ACTION_TYPES` covers core's union.
 *
 * A member core adds is a compile error here rather than a 400 from
 * `save-tx-action` on a value core itself produced.
 */
type AssetActionTypesExhaustive = Exclude<
  EdgeAssetActionType,
  (typeof ASSET_ACTION_TYPES)[number]
> extends never
  ? true
  : never
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const ASSET_ACTION_TYPES_EXHAUSTIVE: AssetActionTypesExhaustive = true

export const asEdgeAssetAction: Cleaner<EdgeAssetAction> = asNotArray(
  asObject({
    assetActionType: asValue<EdgeAssetActionType[]>(...ASSET_ACTION_TYPES)
  })
)

const asEdgeTxActionSwap = asObject({
  actionType: asValue<Array<'swap'>>('swap'),
  swapInfo: asObject({
    pluginId: asString,
    displayName: asString,
    isDex: asOptional(asBoolean),
    orderUri: asOptional(asString),
    supportEmail: asString
  }),
  orderId: asOptional(asString),
  orderUri: asOptional(asString),
  isEstimate: asOptional(asBoolean),
  canBePartial: asOptional(asBoolean),
  fromAsset: asEdgeAssetAmount,
  toAsset: asEdgeAssetAmount,
  payoutAddress: asString,
  payoutWalletId: asString,
  refundAddress: asOptional(asString)
})

/**
 * The swap-and-send flows, which core tells apart from a plain swap.
 *
 * `privacy` is what a Stealth send sets, and the GUI's display derivation
 * reads it to suppress a stored payee name — so an engine that dropped the
 * field would publish a `savedAction` the app could not render the same way.
 * No `payoutWalletId`: the recipient is an address, not a wallet this
 * account holds.
 */
const asEdgeTxActionSwapSend = asObject({
  actionType: asValue<Array<'swapSend'>>('swapSend'),
  swapInfo: asObject({
    pluginId: asString,
    displayName: asString,
    isDex: asOptional(asBoolean),
    orderUri: asOptional(asString),
    supportEmail: asString
  }),
  orderId: asOptional(asString),
  orderUri: asOptional(asString),
  isEstimate: asBoolean,
  fromAsset: asEdgeAssetAmount,
  toAsset: asEdgeAssetAmount,
  payoutAddress: asString,
  refundAddress: asOptional(asString),
  privacy: asBoolean
})

const asEdgeTxActionStake = asObject({
  actionType: asValue<Array<'stake'>>('stake'),
  pluginId: asString,
  stakeAssets: asArray(asEdgeAssetAmount)
})

const asEdgeTxActionFiat = asObject({
  actionType: asValue<Array<'fiat'>>('fiat'),
  orderId: asString,
  orderUri: asOptional(asString),
  isEstimate: asBoolean,
  fiatPlugin: asObject({
    providerId: asString,
    providerDisplayName: asString,
    supportEmail: asOptional(asString)
  }),
  payinAddress: asOptional(asString),
  payoutAddress: asOptional(asString),
  fiatAsset: asEdgeFiatAmount,
  cryptoAsset: asEdgeAssetAmount
})

const asEdgeTxActionTokenApproval = asObject({
  actionType: asValue<Array<'tokenApproval'>>('tokenApproval'),
  tokenApproved: asEdgeAssetAmount,
  tokenContractAddress: asString,
  contractAddress: asString
})

const asEdgeTxActionGiftCard = asObject({
  actionType: asValue<Array<'giftCard'>>('giftCard'),
  orderId: asString,
  orderUri: asOptional(asString),
  productId: asOptional(asString),
  quoteId: asOptional(asString),
  provider: asObject({
    providerId: asString,
    displayName: asString,
    supportEmail: asOptional(asString)
  }),
  card: asObject({
    name: asString,
    imageUrl: asOptional(asString),
    fiatAmount: asString,
    fiatCurrencyCode: asString
  }),
  redemption: asOptional(
    asObject({
      code: asOptional(asString),
      url: asOptional(asString)
    })
  )
})

/**
 * One cleaner per `actionType`, keyed by core's own discriminant.
 *
 * `Record<EdgeTxAction['actionType'], …>` rather than `Record<string, …>`,
 * so a member core adds is a compile error here instead of a 400 from
 * `save-tx-action` on a value core itself produced. Nothing else would
 * notice: `checkCoreAlignment` compares method signatures, never a union's
 * members.
 */
const txActionCleaners: Record<
  EdgeTxAction['actionType'],
  Cleaner<EdgeTxAction>
> = {
  swap: asEdgeTxActionSwap,
  swapSend: asEdgeTxActionSwapSend,
  stake: asEdgeTxActionStake,
  fiat: asEdgeTxActionFiat,
  tokenApproval: asEdgeTxActionTokenApproval,
  giftCard: asEdgeTxActionGiftCard
}

/**
 * Every `actionType` the dispatcher accepts.
 *
 * Exported for `derivedNumbers.test.ts`, which pins the published
 * `savedAction` description against it: that description cannot interpolate
 * the set — `extractRoutes` reads `doc()` strings as literals through the
 * checker — and it had already gone stale, listing five of the six after
 * `swapSend` arrived from develop. A caller holding a `swapSend` action read
 * that the engine would not take it.
 */
export const TX_ACTION_TYPES = Object.keys(txActionCleaners) as Array<
  EdgeTxAction['actionType']
>

/**
 * The `actionType` union, dispatched on the discriminant core uses.
 *
 * Dispatched rather than `asEither`, which reports only the last alternative
 * it tried — `{ actionType: 'stake' }` with a missing field complained
 * `Expected "giftCard"`, naming neither the field nor the actual shape.
 */
export const asEdgeTxAction: Cleaner<EdgeTxAction> = asNotArray(raw => {
  const { actionType } = asObject({ actionType: asString }).withRest(raw)
  // `hasOwn`, not a truthiness test on the lookup: `txActionCleaners` is a
  // plain object literal, so `actionType: "toString"` resolved
  // `Object.prototype.toString` — not null, so the guard below was skipped
  // and this returned a string as an `EdgeTxAction`. `"constructor"` was
  // worse: `Object(raw)` handed back the unvalidated body. Either reached
  // `wallet.saveTxAction`, where core dispatches
  // `CURRENCY_WALLET_FILE_CHANGED` before its own uncleaner rejects, so the
  // caller got a 500 from a route promising only 400 and 404. Same guard
  // `util/exchangeDenom.ts` uses for the same reason.
  const cleaner = hasOwn(txActionCleaners, actionType)
    ? // The cast is what `hasOwn` has just established: the map is keyed by
      // core's own `actionType` union, so a key it owns is a member of it.
      txActionCleaners[actionType as EdgeTxAction['actionType']]
    : null
  if (cleaner == null) {
    throw new TypeError(
      `Unknown actionType "${actionType}": expected one of ${Object.keys(
        txActionCleaners
      ).join(', ')}`
    )
  }
  return cleaner(raw)
})

/**
 * One plugin's entry in `keys.json` or the info server's signed `appKeys`.
 *
 * The payload is genuinely open-ended per plugin, so `.withRest` keeps
 * whatever a plugin needs; the two fields this code reads are not open-ended
 * and are checked. `false` in place of the object disables the plugin.
 *
 * `asNotArray`, because `asObject` accepts one: `["a","b"]` cleaned to
 * `{"0":"a","1":"b"}` — `.withRest` keeps the indices — so
 * `initFromKeysEntry` saw a non-empty object and enabled the plugin with
 * *that* as its init, and `[]` cleaned to `{}` and enabled it as `true`.
 * Neither warned, which is the one thing the `asMaybe`/`warn` arm exists to
 * guarantee for a value that is "neither `false`, nor absent, nor `true`" —
 * and these entries come from `keys.json` and from the info server's signed
 * `appKeys`, the same untrusted source the string `"false"` was fixed for.
 */
export const asPluginKeysEntry = asNotArray(
  asObject({
    enabled: asOptional(asBoolean),
    edgeApiKey: asOptional(asString)
  }).withRest
)

// ---------------------------------------------------------------------------
// Structured request shapes
//
// These were declared `asCoreValue` (i.e. `asUnknown`) and cast in the
// handler, so a malformed value became a 500 from a property access rather
// than the 400 the route declares — `create-currency-wallets
// --create-wallets='[null]'` answered
// `INTERNAL_ERROR: Cannot read properties of null (reading 'walletType')`.
// `.withRest` keeps whatever core and the plugins add; only the fields a
// handler or core itself requires are named.
// ---------------------------------------------------------------------------

/** One entry of a batch wallet create or split. */
export const asCreateCurrencyWallet = asObject({
  walletType: asString,
  name: asOptional(asString),
  fiatCurrencyCode: asOptional(asString)
}).withRest

/**
 * A spend target: where the money goes and how much.
 *
 * `publicAddress` is required *here*, not in a handler helper. The rule used
 * to live in one with a single call site — the caller-supplied `spendInfo`
 * branch of `buildSpendInfo` — so `sweep-private-keys`, which takes
 * `asSweepSpendInfo` and goes straight to `wallet.sweepPrivateKeys`, had no
 * check at all. Core does `if (publicAddress == null) continue`, so such a
 * target is dropped and the rest of the transaction is still signed and
 * broadcast, and `.withRest` keeps a typo such as `publicAdress` as an
 * unread rest field.
 *
 * Non-empty, because `''` is an address core drops just as silently;
 * `asWalletId` is `asNonEmptyString` for the same reason. Only the
 * `nativeAmount` rule stays per-route, since `get-max-spendable` and
 * `spend --use-max` legitimately leave the amount to core.
 */
const asSpendTargetShape = asObject({
  publicAddress: asNonEmptyString,
  nativeAmount: asOptional(asIntegerString),
  otherParams: asOptional(asObject(asUnknown))
}).withRest

/**
 * The target, refusing the legacy memo fields.
 *
 * `memo` and `uniqueIdentifier` on a target — and `uniqueIdentifier` inside
 * its `otherParams` — are a second door for a destination tag that neither
 * the memo cleaner nor `assertMemosUsable` sees. Core's `upgradeMemos`
 * turns them into memos only when the chain sets `memoType`, and clears
 * them either way; no account-based chain sets it, so an XRP spend with a
 * target-level `memo` was signed and broadcast with no `DestinationTag`.
 * They are refused, naming `memos` as the field that is checked.
 */
export const asSpendTarget: Cleaner<ReturnType<typeof asSpendTargetShape>> = (
  raw: unknown
) => {
  const target = asSpendTargetShape(raw)
  const rest = target as Record<string, unknown>
  const legacy = ['memo', 'uniqueIdentifier'].filter(key => rest[key] != null)
  if (target.otherParams?.uniqueIdentifier != null) {
    legacy.push('otherParams.uniqueIdentifier')
  }
  if (legacy.length > 0) {
    throw new TypeError(
      `${legacy.join(
        ', '
      )} on a spend target is not applied on every chain; put the memo in spendInfo.memos, which is checked against the chain's memo options`
    )
  }
  return target
}

/**
 * One memo, in the shape core's `EdgeMemo` publishes.
 *
 * Shaped, because the memo is what carries an exchange deposit's
 * destination tag. `asObject(asUnknown)` let `{"type":"Number",…}` or
 * `{"type":"tag",…}` through, core's `upgradeMemos` does not check it, and
 * the XRP engine handles only `number` and `text` — so the payment was
 * signed and broadcast with no `DestinationTag`, which on a deposit is money
 * credited to nobody. `buildSpendInfo` then checks each one against the
 * wallet's own `memoOptions`, as the URI path already did.
 */
const asMemoType: Cleaner<EdgeMemo['type']> = asValue('text', 'number', 'hex')

export const asEdgeMemoInput = asObject({
  type: doc(
    asMemoType,
    'The memo kind, which has to be one the chain takes (`currencyInfo.memoOptions`).'
  ),
  value: doc(
    asString,
    'The memo, as text: digits for `number`, hex for `hex`.'
  ),
  hidden: asOptional(asBoolean),
  memoName: asOptional(asString)
})

/**
 * The body `sweep-private-keys` really takes.
 *
 * `asSpendInfo` is the wrong cleaner for it — a sweep legitimately has no
 * `spendTargets` — and `asCoreValue` plus a cast meant
 * `--spend-info='{}'` passed the declaration and reached
 * `UtxoEngine.sweepPrivateKeys`, which throws a plain `Error`: a 500 on a
 * route declaring 400 and 422. It also meant `privateKeys`, the field the
 * route actually requires, appeared nowhere in the published type.
 */
export const asSweepSpendInfo = asObject({
  privateKeys: doc(
    asArray(asString),
    'The keys to sweep from, in the plugin\u2019s import format.'
  ),
  // No fallbacks, for the reason `asSpendInfo.tokenId` gives: a nested
  // optional with one is published as required. This shape made that
  // pointed — its own docblock exists because "a sweep legitimately has no
  // `spendTargets`", and the document the branch shipped said a sweep must
  // send some.
  tokenId: asOptional(asRequestTokenId),
  spendTargets: asOptional(asArray(asSpendTarget)),
  metadata: asOptional(asEdgeMetadata),
  memos: asOptional(asArray(asEdgeMemoInput))
}).withRest

/**
 * Enough of an `EdgeTransaction` to be recognisable.
 *
 * `accelerate --transaction='{}'` reached `wallet.accelerate` with a
 * non-transaction through `asCoreValue` and a cast. `.withRest`, because a
 * transaction carries plugin-specific fields this engine has no business
 * enumerating.
 */
export const asTransactionInput = asObject({
  txid: doc(asString, 'The transaction to bump.'),
  currencyCode: asOptional(asString),
  nativeAmount: asOptional(asString),
  networkFee: asOptional(asString),
  walletId: asOptional(asString)
}).withRest

/**
 * An `EdgeSpendInfo` as a caller may send it.
 *
 * `spendTargets` is required because every handler reads it: an empty object
 * passed `isPlainObject` and then threw on `spendInfo.spendTargets.length`.
 */
export const asSpendInfo = asObject({
  spendTargets: asArray(asSpendTarget),
  // `asRequestTokenId`, like every other request-position tokenId —
  // including its sibling in `asSweepSpendInfo` and the one in
  // `asSpendShorthandBody`, the field this body sits beside. As plain
  // `asString` this was the one that took the CLI's text `"null"` as a
  // contract id, so `--spend-info='{…,"tokenId":"null"}'` asked for a token
  // called `null` — a 404 from `assertTokenId` — where the same spelling one
  // level up means the native asset.
  //
  // `asOptional(…, null)`, not `asOptional(asEither(…, asNull))`:
  // `asOptional` intercepts a nullish value before the inner cleaner runs,
  // so the `asNull` arm was unreachable.
  //
  // And no fallback, because this shape is *nested*. `asOptional(c, x)`
  // erases `undefined` from the output type, and the generator reads a
  // nested field's optionality from the printed type — `optionalNames`
  // reads the source, but only for a route's own `query`/`body` literal. So
  // every nested optional with a fallback was published as **required**:
  // `openapi.json` listed `spendInfo.required = ["spendTargets","tokenId"]`
  // while a caller omitting `tokenId` succeeded. The handler defaults it
  // instead, which `buildSpendInfo` already did (`spendInfo.tokenId ?? null`).
  tokenId: asOptional(asRequestTokenId),
  metadata: asOptional(asEdgeMetadata),
  networkFeeOption: asOptional(asString),
  customNetworkFee: asOptional(asObject(asUnknown)),
  rbfTxid: asOptional(asString),
  memos: asOptional(asArray(asEdgeMemoInput)),
  assetAction: asOptional(asEdgeAssetAction),
  savedAction: asOptional(asEdgeTxAction),
  otherParams: asOptional(asObject(asUnknown))
}).withRest

/**
 * The `coreExtra` prose for the three shorthand fields, declared once.
 *
 * `get-max-spendable` and `make-spend` each carried a verbatim copy, under a
 * comment saying `coreExtra` could not be shared because `extractRoutes`
 * reads it as an object literal. That was true of `recordLiteral` and is not
 * any more: it resolves through `resolveObjectLiteral` like every other
 * field, which already followed a name — including an import alias — to its
 * declaration. `spend` declares `core: null` and so has no `coreExtra` to
 * share.
 */
export const SPEND_SHORTHAND_CORE_EXTRA = {
  to:
    'Shorthand the engine expands into `spendTargets`, so a one-output ' +
    'send needs no nested JSON.',
  nativeAmount: 'Amount for the `to` shorthand, in the smallest unit.',
  amount:
    'Alias of `nativeAmount` for the `to` shorthand: the chain\u2019s smallest unit, not whole coins.'
}

/**
 * The convenience spend body, shared by the three routes that take it.
 *
 * `get-max-spendable`, `spend` and `make-spend` all accept the same seven
 * fields, and all three wrote them out verbatim — including the long
 * `spendInfo` prose and the `amount` alias line. These declarations *are*
 * the published reference, so three copies meant one wording change
 * published the same request three different ways, and no gate compares
 * them: `checkCoreAlignment` cannot, because `spend` declares `core: null`.
 */
export const asSpendShorthandBody = asObject({
  walletId: asWalletId,
  spendInfo: asOptional(
    doc(
      asSpendInfo,
      'A full `EdgeSpendInfo`, used as-is when present. `spendTargets` is required.'
    )
  ),
  to: asOptional(doc(asString, SPEND_TO_DOC)),
  nativeAmount: asOptional(doc(asIntegerString, SPEND_AMOUNT_DOC)),
  amount: asOptional(doc(asIntegerString, SPEND_AMOUNT_ALIAS_DOC)),
  tokenId: asOptional(doc(asRequestTokenId, TOKEN_ID_DOC), null),
  metadata: asOptional(doc(asEdgeMetadata, SPEND_METADATA_DOC))
})

/** Plugin key material for `create-wallet`. */
export const asWalletKeys = asObject(asUnknown)

/**
 * The published shapes, derived from their cleaners.
 *
 * The engine's response builders were typed `Record<string, unknown>` —
 * `pendingSummary`, `summarizeQuote`, `summarizeWallet` — so nothing
 * compiled the object against the shape the API publishes. The only check
 * was `checkResponse`, and `EDGE_CLI_CHECK_RESPONSES` defaults to `warn`, so
 * a renamed or dropped field logged one line and still shipped. Every other
 * declaration in the CLI states the opposite rule in as many words:
 * "Derived from the cleaner, so the two cannot drift."
 */
export type Session = ReturnType<typeof asSession>
export type WalletSummary = ReturnType<typeof asWalletSummary>
export type SwapQuote = ReturnType<typeof asSwapQuote>
export type PendingEdgeLogin = ReturnType<typeof asPendingEdgeLogin>

/**
 * The `subscription.closed` frame's payload.
 *
 * Declared beside the other published shapes because the *client* acts on
 * it: `reason` decides `edge-cli subscribe`'s exit code through
 * `exitCodeForClose`. It used to be a hand-written interface and a cast on
 * the client side, over a payload that arrives from `emitFrame`'s bare
 * `JSON.parse`, so nothing held the two halves to one spelling.
 *
 * `sessionId` is the redacted form `closeScope` writes — a `sessionId` is a
 * bearer token, and this frame goes to every scoped subscriber.
 */
export const asSubscriptionClosed = asObject({
  reason: asOptional(asString),
  sessionId: asOptional(asString)
}).withRest
