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
import type { Cleaner } from 'cleaners'
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

/**
 * The wallet a call acts on.
 *
 * Not a path parameter. A wallet id is base64 — `7o7i6/tlI+qi…=` is an
 * ordinary one — and a value containing `/` cannot be a path segment without
 * percent-encoding that callers forget. Path parameters are reserved for
 * base58 identifiers, which have no such character.
 */
export const asWalletId = doc(
  asString,
  'The wallet to act on. A full wallet id, or any unique prefix of one. An ' +
    'ambiguous prefix returns `409 AMBIGUOUS_WALLET_ID` with ' +
    '`details.candidates`.'
)

// ------------------------------------------------------------ query values
// A query string carries only text, so `?waitForAll=true` arrives as the four
// characters "true". These cleaners convert on the way in, which lets a route
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
 * `EdgeTokenId` from a query string.
 *
 * The native asset is `null`, which a URL can only spell as the text "null" —
 * or by omitting the parameter. Both mean the same thing.
 */
export const asQueryTokenId: Cleaner<string | null> = raw => {
  if (raw == null || raw === '' || raw === 'null') return null
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

/** One party's side of a single share, for a wallet's audit trail. */
export const asWalletShareRecord = asObject({
  name: doc(
    asString,
    "The other party's chosen identity, empty if they gave none."
  ),
  shareType: doc(asValue('viewOnly', 'spend'), 'What that share handed over.'),
  sharingDate: doc(asString, 'When the share happened, as an ISO date.')
})

/**
 * A wallet's sharing history.
 *
 * History, not authority: it grants nothing, cannot revoke, and each account
 * keeps its own copy, so the two sides may disagree.
 */
export const asWalletSharingState = asObject({
  sharedWith: doc(
    asArray(asWalletShareRecord),
    'Parties this account gave the wallet to.'
  ),
  sharedFrom: doc(
    asArray(asWalletShareRecord),
    'Parties this account received the wallet from.'
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
  canSign: doc(
    asOptional(asBoolean),
    'False when the wallet holds no private key, so it can watch and sync ' +
      'but not spend. A wallet shared `viewOnly` arrives this way.'
  ),
  viewOnly: doc(
    asOptional(asBoolean),
    'True when the wallet holds only viewing keys. Read from the key ' +
      'structure itself, never from the sharing records.'
  ),
  sharingState: doc(
    asOptional(asEither(asWalletSharingState, asValue(null))),
    'Who this wallet was shared with and who shared it here, null when it ' +
      'has no sharing history.'
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

/** One wallet in a share, with the mode chosen for that wallet alone. */
export const asWalletShareSpec = asObject({
  walletId: doc(asString, 'The wallet to share. A full wallet id.'),
  mode: doc(
    asValue('viewOnly', 'spend'),
    'What the recipient may do with this wallet. `viewOnly` sends the ' +
      'storage and public keys, so the wallet syncs and shows balances but ' +
      'cannot sign. `spend` sends the private keys as well. Chosen per ' +
      'wallet, so one share can mix the two.'
  )
})

/**
 * A wallet share in progress.
 *
 * `receivedWalletIds` fills once `state` is `done`. The share is bound to the
 * session that created it.
 */
export const asPendingWalletShare = asObject({
  objectId: doc(
    asString,
    'Handle for the value the engine is holding. Pass it to the calls that consume it.'
  ),
  shareId: doc(
    asString,
    'Same value as `objectId`, under the name the poll command takes.'
  ),
  kind: doc(
    asValue('pendingWalletShare'),
    'What the handle refers to, which decides the calls that accept it.'
  ),
  expiresAt: doc(
    asEither(asString, asValue(null)),
    'When the lobby closes and the QR code stops working.'
  ),
  lobbyId: doc(asString, 'Lobby the other device connects to.'),
  counterpartyName: doc(
    asEither(asString, asValue(null)),
    "The other party's chosen identity, null until they identify themselves."
  ),
  uri: doc(
    asString,
    'The `https://deep.edge.app` link to render as a QR code for the other ' +
      'device to scan.'
  ),
  state: doc(
    asValue('pending', 'started', 'done', 'error', 'closed'),
    'How far the share has got: `pending` before the other device connects, ' +
      '`started` once it has, and `done` when the keys have moved.'
  ),
  sharedWallets: doc(
    asEither(asArray(asWalletShareSpec), asValue(null)),
    'Each wallet in the share with the mode it was shared at, known once the ' +
      'payload has been exchanged.'
  ),
  receivedWalletIds: doc(
    asEither(asArray(asString), asValue(null)),
    'Wallet ids now in this account, null until `state` is `done`.'
  ),
  error: doc(
    asEither(asString, asValue(null)),
    'Why the share failed, set only when `state` is `error`.'
  )
})

// `asDate` is re-exported so route files can describe date fields without
// each importing it from `cleaners` directly.
export { asDate }
