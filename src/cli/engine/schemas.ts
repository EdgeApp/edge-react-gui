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
  EdgeMetadata,
  EdgeMetadataChange,
  EdgeTxAction
} from 'edge-core-js'

import { asBiggystring } from '../../util/cleaners'
import { doc } from './doc'
import {
  SPEND_AMOUNT_ALIAS_DOC,
  SPEND_AMOUNT_DOC,
  SPEND_METADATA_DOC,
  SPEND_TO_DOC,
  TOKEN_ID_DOC
} from './fieldDocs'

/** `EdgeTokenId`: a contract id, or null for the native asset. */
export const asTokenId = asEither(asString, asValue(null))

/** A string with something in it. */
export const asNonEmptyString: Cleaner<string> = raw => {
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
  'The wallet to act on. A full wallet id, or any unique prefix of one. An ' +
    'ambiguous prefix returns `409 AMBIGUOUS_WALLET_ID` with ' +
    '`details.candidates`.'
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
  const n = Number(raw)
  if (!Number.isInteger(n)) throw new TypeError('Expected a whole number')
  return n
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
  const n = asQueryInteger(raw)
  if (n < 0) throw new TypeError('Expected zero or a whole positive number')
  return n
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
  const n = Number(raw)
  if (!Number.isFinite(n)) throw new TypeError('Expected a number')
  return n
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
    return seconds
  }

/**
 * A date written out in a query string, as ISO-8601 or epoch milliseconds.
 */
export const asQueryDate: Cleaner<Date> = raw => {
  if (raw instanceof Date) return raw
  if (typeof raw !== 'string' || raw.trim() === '') {
    throw new TypeError('Expected an ISO-8601 date or epoch milliseconds')
  }
  const ms = Number(raw)
  const date = Number.isFinite(ms) ? new Date(ms) : new Date(raw)
  if (Number.isNaN(date.getTime())) {
    throw new TypeError('Expected an ISO-8601 date or epoch milliseconds')
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
  id: doc(asString, 'Same value as `walletId`; core exposes both names.'),
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

/** Identity for a method-bearing core value held server-side. */
export const asObjectHandle = asObject({
  objectId: doc(
    asString,
    'Handle for the value the engine is holding. Pass it to the calls that consume it.'
  ),
  kind: doc(
    asValue('transaction', 'pendingLogin', 'swap', 'lobby'),
    'What the handle refers to, which decides the calls that accept it.'
  ),
  createdAt: doc(asString, 'When the engine took the handle.'),
  expiresAt: doc(
    asString,
    'When the engine drops the handle. Handles live 5 minutes.'
  ),
  sessionId: doc(
    asOptional(asString),
    'Session that created the handle; only that session may use it.'
  ),
  walletId: doc(
    asOptional(asString),
    'Wallet the handle is bound to, when it belongs to one.'
  )
})

/** An object handle carrying the transaction it refers to. */
export const asTransactionHandle = asObject({
  objectId: doc(
    asString,
    'Handle for the value the engine is holding. Pass it to the calls that consume it.'
  ),
  kind: doc(
    asValue('transaction'),
    'What the handle refers to, which decides the calls that accept it.'
  ),
  expiresAt: doc(
    asString,
    'When the engine drops the handle. Handles live 5 minutes.'
  ),
  sessionId: doc(
    asOptional(asString),
    'Session that created the handle; only that session may use it.'
  ),
  walletId: doc(
    asOptional(asString),
    'Wallet the handle is bound to, when it belongs to one.'
  ),
  transaction: doc(
    asCoreValue,
    '`EdgeTransaction` as it stands after this step. Unsigned after ' +
      '`make-spend`, signed after `sign-tx`, and carrying a txid once broadcast.'
  )
})

/** A swap quote, held under a `swap_` handle with a 5 minute TTL. */
export const asSwapQuote = asObject({
  objectId: doc(
    asString,
    'Handle for the value the engine is holding. Pass it to the calls that consume it.'
  ),
  kind: doc(
    asValue('swap'),
    'What the handle refers to, which decides the calls that accept it.'
  ),
  expiresAt: doc(
    asString,
    'When the engine drops the handle. Handles live 5 minutes.'
  ),
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
  objectId: doc(
    asString,
    'Handle for the value the engine is holding. Pass it to the calls that consume it.'
  ),
  pendingId: doc(
    asString,
    'Same value as `objectId`, under the name the poll command takes.'
  ),
  kind: doc(
    asValue('pendingLogin'),
    'What the handle refers to, which decides the calls that accept it.'
  ),
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
 * `scripts/buildApiDocs.ts` writes `components.schemas.ErrorEnvelope` by
 * hand, and the runtime shape is named once as `ErrorResponse` in
 * `errors.ts`, which `output.ts` now uses as well.
 *
 * A fourth declaration lived here, exported and referenced by nothing, which
 * read as the source of truth for a document it had no part in generating.
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
 * `asString` here was the one field of the five `asEdgeTxAction*` cleaners
 * looser than core's own, and it re-opened the hole those cleaners exist to
 * close. `save-tx-action` with `"nativeAmount":"1.5"` passed this route,
 * then core dispatched `CURRENCY_WALLET_FILE_CHANGED` *before* awaiting the
 * file save, whose `uncleaner(asTransactionFile)` rejected it — so the
 * engine served a `savedAction` the disk did not have for the life of the
 * daemon, and the caller got a 500 on a route declaring only 400 and 404.
 */
const asIntegerString: Cleaner<string> = raw => {
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

export const asEdgeAssetAction: Cleaner<EdgeAssetAction> = asNotArray(
  asObject({
    assetActionType: asValue<EdgeAssetActionType[]>(
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
    )
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

const txActionCleaners: Record<string, Cleaner<EdgeTxAction>> = {
  swap: asEdgeTxActionSwap,
  stake: asEdgeTxActionStake,
  fiat: asEdgeTxActionFiat,
  tokenApproval: asEdgeTxActionTokenApproval,
  giftCard: asEdgeTxActionGiftCard
}

/**
 * The `actionType` union, dispatched on the discriminant core uses.
 *
 * Dispatched rather than `asEither`, which reports only the last alternative
 * it tried — `{ actionType: 'stake' }` with a missing field complained
 * `Expected "giftCard"`, naming neither the field nor the actual shape.
 */
export const asEdgeTxAction: Cleaner<EdgeTxAction> = asNotArray(raw => {
  const { actionType } = asObject({ actionType: asString }).withRest(raw)
  const cleaner = txActionCleaners[actionType]
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
 */
export const asPluginKeysEntry = asObject({
  enabled: asOptional(asBoolean),
  edgeApiKey: asOptional(asString)
}).withRest

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

/** A spend target: where the money goes and how much. */
export const asSpendTarget = asObject({
  publicAddress: asOptional(asString),
  nativeAmount: asOptional(asString),
  uniqueIdentifier: asOptional(asString),
  memo: asOptional(asString),
  otherParams: asOptional(asObject(asUnknown))
}).withRest

/**
 * An `EdgeSpendInfo` as a caller may send it.
 *
 * `spendTargets` is required because every handler reads it: an empty object
 * passed `isPlainObject` and then threw on `spendInfo.spendTargets.length`.
 */
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
  tokenId: asOptional(asRequestTokenId, null),
  spendTargets: asOptional(asArray(asSpendTarget), () => []),
  metadata: asOptional(asEdgeMetadata),
  memos: asOptional(asArray(asObject(asUnknown)))
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

export const asSpendInfo = asObject({
  spendTargets: asArray(asSpendTarget),
  // `asOptional(asString, null)`, not `asOptional(asEither(asString, asNull))`:
  // `asOptional` intercepts a nullish value before the inner cleaner runs, so
  // the `asNull` arm was unreachable.
  tokenId: asOptional(asString, null),
  metadata: asOptional(asEdgeMetadata),
  networkFeeOption: asOptional(asString),
  customNetworkFee: asOptional(asObject(asUnknown)),
  rbfTxid: asOptional(asString),
  memos: asOptional(asArray(asObject(asUnknown))),
  assetAction: asOptional(asEdgeAssetAction),
  savedAction: asOptional(asEdgeTxAction),
  otherParams: asOptional(asObject(asUnknown))
}).withRest

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
  nativeAmount: asOptional(doc(asString, SPEND_AMOUNT_DOC)),
  amount: asOptional(doc(asString, SPEND_AMOUNT_ALIAS_DOC)),
  tokenId: asOptional(doc(asRequestTokenId, TOKEN_ID_DOC), null),
  metadata: asOptional(doc(asEdgeMetadata, SPEND_METADATA_DOC))
})

/** Plugin key material for `create-wallet`. */
export const asWalletKeys = asObject(asUnknown)
