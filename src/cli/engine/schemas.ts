/**
 * Response shapes the engine reuses across routes.
 *
 * These describe what a handler returns. They are *not* run against live
 * responses — a strict cleaner would strip fields a plugin adds — but they are
 * the documented shape, and tests can assert real responses against them.
 *
 * Request cleaners live beside their route. They use `.withRest` so declared
 * fields are validated while anything a handler forwards wholesale to core
 * still passes through untouched.
 */
import {
  asArray,
  asBoolean,
  asDate,
  asEither,
  asNumber,
  asObject,
  asOptional,
  asString,
  asUnknown,
  asValue
} from 'cleaners'

import { doc } from './doc'

/** `EdgeTokenId`: a contract id, or null for the native asset. */
export const asTokenId = asEither(asString, asValue(null))

/** A core value passed through untouched. Documented by name in JSDoc. */
export const asCoreValue = asUnknown

export const asVoid = asValue(undefined)

/** A bare acknowledgement. */
export const asOk = asObject({
  ok: doc(asBoolean, 'Always true; a failure arrives as an error envelope.')
})

/** An acknowledgement naming the handle the call consumed. */
export const asOkObject = asObject({ ok: asBoolean, objectId: asString })

export const asLoginMethod = asValue(
  'password',
  'pin',
  'key',
  'recovery',
  'edge',
  'create'
)

/** Returned by every successful login, by session listing, and by keepalive. */
export const asSession = asObject({
  sessionId: asString,
  username: asOptional(asString),
  rootLoginId: asString,
  loginMethod: asLoginMethod,
  autoLogoutSeconds: asNumber,
  expiresAt: asEither(asString, asValue(null)),
  lastActivityAt: asString,
  createdAt: asString
})

/** One currency wallet. `walletId` and `id` are the same value. */
export const asWalletSummary = asObject({
  walletId: asString,
  id: asString,
  type: asString,
  name: asEither(asString, asValue(null)),
  pluginId: asString,
  currencyCode: asString,
  fiatCurrencyCode: asString,
  blockHeight: asNumber,
  syncStatus: asCoreValue,
  syncRatio: asOptional(asString),
  paused: asBoolean,
  imported: asOptional(asBoolean),
  created: asEither(asString, asValue(null)),
  enabledTokenIds: asArray(asString),
  detectedTokenIds: asArray(asString),
  unactivatedTokenIds: asArray(asString)
})

/** One asset balance, with the display amount already divided out. */
export const asBalance = asObject({
  tokenId: asTokenId,
  currencyCode: asString,
  nativeAmount: asString,
  displayAmount: asString
})

/** Identity for a method-bearing core value held server-side. */
export const asObjectHandle = asObject({
  objectId: asString,
  kind: asValue('transaction', 'pendingLogin', 'swap', 'lobby'),
  expiresAt: asString,
  sessionId: asOptional(asString),
  walletId: asOptional(asString)
})

/** An object handle carrying the transaction it refers to. */
export const asTransactionHandle = asObject({
  objectId: asString,
  kind: asValue('transaction'),
  expiresAt: asString,
  sessionId: asOptional(asString),
  walletId: asOptional(asString),
  transaction: asCoreValue
})

/** A swap quote, held under a `swap_` handle with a 5 minute TTL. */
export const asSwapQuote = asObject({
  objectId: asString,
  kind: asValue('swap'),
  expiresAt: asString,
  pluginId: asString,
  isEstimate: asBoolean,
  canBePartial: asEither(asBoolean, asValue(null)),
  maxFulfillmentSeconds: asEither(asNumber, asValue(null)),
  minReceiveAmount: asEither(asString, asValue(null)),
  fromNativeAmount: asString,
  toNativeAmount: asString,
  networkFee: asObject({ nativeAmount: asString, tokenId: asTokenId }),
  quoteExpirationDate: asEither(asString, asValue(null)),
  swapInfo: asObject({
    pluginId: asString,
    displayName: asString,
    supportEmail: asString,
    isDex: asEither(asBoolean, asValue(null))
  }),
  request: asObject({
    fromTokenId: asTokenId,
    toTokenId: asTokenId,
    nativeAmount: asString,
    quoteFor: asValue('from', 'to', 'max'),
    fromWalletId: asString,
    toWalletId: asString
  })
})

/** A QR / lobby login in progress. `session` fills once `state` is `done`. */
export const asPendingEdgeLogin = asObject({
  objectId: asString,
  pendingId: asString,
  kind: asValue('pendingLogin'),
  expiresAt: asEither(asString, asValue(null)),
  lobbyId: asString,
  uri: asString,
  state: asValue('pending', 'started', 'done', 'error', 'closed'),
  username: asEither(asString, asValue(null)),
  session: asEither(asSession, asValue(null)),
  error: asEither(asString, asValue(null))
})

/** The enabled token set after a change. */
export const asEnabledTokens = asObject({
  enabledTokenIds: asArray(asString)
})

/** Every failure, on both transports. */
export const asErrorEnvelope = asObject({
  error: asObject({
    code: asString,
    message: asString,
    status: asNumber,
    details: asOptional(asUnknown)
  })
})

// `asDate` is re-exported so route files can describe date fields without
// each importing it from `cleaners` directly.
export { asDate }
