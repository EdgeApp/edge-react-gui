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

/** Returned by every successful login, by session listing, and by keepalive. */
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
    asString,
    'The same balance divided by the display multiplier.'
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

/** Every failure, on both transports. */
export const asErrorEnvelope = asObject({
  error: doc(
    asObject({
      code: asString,
      message: asString,
      status: asNumber,
      details: asOptional(asUnknown)
    }),
    'Stable `code` to branch on, human-readable `message`, the HTTP `status` ' +
      'repeated for clients that only see the body, and `details` when the ' +
      'code carries extra data.'
  )
})

// `asDate` is re-exported so route files can describe date fields without
// each importing it from `cleaners` directly.
export { asDate }
