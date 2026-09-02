/**
 * Shapes the engine reuses across many routes, plus the error catalogue.
 *
 * Nine schemas here cover roughly 60 of the 115 routes. Endpoints `$ref` them
 * rather than restating fields, so a change to `summarizeWallet` (say) is a
 * one-line edit that propagates to every route that returns a wallet.
 */
import { f, type NamedSchema, nul, opt, optNul, s } from './schema'

export const LOGIN_METHODS = [
  'password',
  'pin',
  'key',
  'recovery2',
  'edge',
  'create'
]

export const schemas: NamedSchema[] = [
  {
    name: 'Session',
    doc: 'Returned by every successful login, by session listing, and by the keepalive. `username` is absent for accounts that have no username (light accounts).',
    source: 'src/cli/engine/sessions.ts (SessionStore.toInfo)',
    schema: s.object([
      f('sessionId', s.string({ example: 'sess_9xKq2…' })),
      optNul('username', s.string({ example: 'alice' })),
      f('rootLoginId', s.string()),
      f('loginMethod', s.string({ enum: LOGIN_METHODS })),
      f('autoLogoutSeconds', s.int(3600), '`0` disables auto-logout.'),
      nul('expiresAt', s.date(), '`null` when `autoLogoutSeconds` is `0`.'),
      f('lastActivityAt', s.date()),
      f('createdAt', s.date())
    ])
  },
  {
    name: 'WalletSummary',
    doc: 'One currency wallet. `walletId` and `id` are the same value; `id` is kept for callers written against the core object.',
    source: 'src/cli/engine/routes/wallets.ts (summarizeWallet)',
    schema: s.object([
      f('walletId', s.string()),
      f('id', s.string(), 'Alias of `walletId`.'),
      f('type', s.string({ example: 'wallet:bitcoin' })),
      nul('name', s.string({ example: 'My BTC' })),
      f('pluginId', s.string({ example: 'bitcoin' })),
      f('currencyCode', s.string({ example: 'BTC' })),
      f('fiatCurrencyCode', s.string({ example: 'iso:USD' })),
      f('blockHeight', s.int(800000)),
      f('syncStatus', s.core('EdgeWalletSyncStatus')),
      opt(
        'syncRatio',
        s.string({ example: '100%' }),
        'A **percentage string**, not a number. Absent when the wallet reports no `totalRatio`.'
      ),
      f('paused', s.boolean()),
      opt('imported', s.boolean()),
      nul('created', s.date()),
      f('enabledTokenIds', s.array(s.string())),
      f('detectedTokenIds', s.array(s.string())),
      f('unactivatedTokenIds', s.array(s.string()))
    ])
  },
  {
    name: 'ObjectHandle',
    doc: 'Identity for a method-bearing core value. See “Ephemeral object handles”.',
    source: 'src/cli/engine/objectHandles.ts',
    schema: s.object([
      f('objectId', s.string({ example: 'tx_3fK9…' })),
      f(
        'kind',
        s.string({ enum: ['transaction', 'pendingLogin', 'swap', 'lobby'] })
      ),
      f('expiresAt', s.date()),
      opt('sessionId', s.string()),
      opt('walletId', s.string())
    ])
  },
  {
    name: 'TransactionHandle',
    doc: 'An `ObjectHandle` carrying the transaction it refers to. Returned by every step of the staged spend workflow.',
    source:
      'src/cli/engine/routes/spend.ts (storeTransaction / txHandleResponse)',
    schema: s.object([
      f('objectId', s.string({ example: 'tx_3fK9…' })),
      f('kind', s.string({ enum: ['transaction'] })),
      f('expiresAt', s.date()),
      opt('sessionId', s.string()),
      opt('walletId', s.string()),
      f('transaction', s.core('EdgeTransaction'))
    ])
  },
  {
    name: 'Balance',
    doc: 'One asset balance. `displayAmount` is `nativeAmount` divided by the exchange denomination multiplier, to 18 decimal places.',
    source: 'src/cli/engine/routes/wallets.ts',
    schema: s.object([
      f('tokenId', s.tokenId()),
      f('currencyCode', s.string({ example: 'BTC' })),
      f('nativeAmount', s.amount('12345')),
      f('displayAmount', s.amount('0.00012345'))
    ])
  },
  {
    name: 'SwapQuote',
    doc: 'A swap quote, stored as a `swap_` object handle with a 5 minute TTL.',
    source: 'src/cli/engine/routes/swap.ts (summarizeQuote)',
    schema: s.object([
      f('objectId', s.string({ example: 'swap_7Qk3…' })),
      f('kind', s.string({ enum: ['swap'] })),
      f('expiresAt', s.date(), 'Handle expiry, not quote expiry.'),
      f('pluginId', s.string({ example: 'changenow' })),
      f('isEstimate', s.boolean()),
      nul('canBePartial', s.boolean()),
      nul('maxFulfillmentSeconds', s.int()),
      nul('minReceiveAmount', s.amount()),
      f('fromNativeAmount', s.amount('90000')),
      f('toNativeAmount', s.amount()),
      f(
        'networkFee',
        s.object([f('nativeAmount', s.amount()), f('tokenId', s.tokenId())])
      ),
      nul('quoteExpirationDate', s.date(), 'When the *quote* goes stale.'),
      f(
        'swapInfo',
        s.object([
          f('pluginId', s.string()),
          f('displayName', s.string({ example: 'ChangeNOW' })),
          f('supportEmail', s.string()),
          nul('isDex', s.boolean())
        ])
      ),
      f(
        'request',
        s.object([
          f('fromTokenId', s.tokenId()),
          f('toTokenId', s.tokenId()),
          f('nativeAmount', s.amount()),
          f('quoteFor', s.string({ enum: ['from', 'to', 'max'] })),
          f('fromWalletId', s.string()),
          f('toWalletId', s.string())
        ])
      )
    ])
  },
  {
    name: 'PendingEdgeLogin',
    doc: 'A QR / lobby login in progress. `session` is filled once `state` reaches `done`.',
    source: 'src/cli/engine/routes/login.ts (pendingSummary)',
    schema: s.object([
      f('objectId', s.string({ example: 'pending_7Qk3…' })),
      f('pendingId', s.string(), 'Alias of `objectId`.'),
      f('kind', s.string({ enum: ['pendingLogin'] })),
      nul('expiresAt', s.date()),
      f(
        'lobbyId',
        s.string({ example: 'HbC9mVJ2xR4tN8pL' }),
        'The value encoded in the QR code.'
      ),
      f('uri', s.string({ example: 'edge://edge/HbC9mVJ2xR4tN8pL' })),
      f(
        'state',
        s.string({ enum: ['pending', 'started', 'done', 'error', 'closed'] })
      ),
      nul('username', s.string()),
      nul('session', s.ref('Session')),
      nul('error', s.string())
    ])
  },
  {
    name: 'Ok',
    doc: 'A bare acknowledgement.',
    schema: s.object([f('ok', s.boolean())])
  },
  {
    name: 'OkObject',
    doc: 'An acknowledgement that also names the handle the call consumed.',
    schema: s.object([f('ok', s.boolean()), f('objectId', s.string())])
  },
  {
    name: 'EnabledTokens',
    doc: 'The wallet’s enabled token set after the change.',
    source: 'src/cli/engine/routes/tokens.ts',
    schema: s.object([f('enabledTokenIds', s.array(s.string()))])
  },
  {
    name: 'ErrorEnvelope',
    doc: 'Every failure, on both transports. `error.status` always matches the HTTP status. The CLI writes this same object to stderr.',
    source: 'src/cli/engine/errors.ts (toErrorBody)',
    schema: s.object([
      f(
        'error',
        s.object([
          f('code', s.string({ example: 'WALLET_NOT_FOUND' })),
          f('message', s.string()),
          f('status', s.int(404)),
          opt(
            'details',
            s.map(s.unknown()),
            'Code-specific; see the error catalogue.'
          )
        ])
      )
    ])
  }
]

export interface ErrorCode {
  code: string
  status: number
  origin: 'engine' | 'core'
  doc: string
  details?: string
}

/**
 * Every code the engine can emit. Engine codes are thrown by `engineError`;
 * core codes are mapped from `edge-core-js` error types by `mapCoreError`.
 */
export const errorCodes: ErrorCode[] = [
  {
    code: 'BAD_REQUEST',
    status: 400,
    origin: 'engine',
    doc: 'Malformed JSON, or a missing / wrongly typed field.'
  },
  {
    code: 'MISSING_BITWAVE_ACCOUNT_ID',
    status: 400,
    origin: 'engine',
    doc: 'Bitwave export requested with no account id in the query and none saved in the wallet’s `exportTxInfo.json`.'
  },
  {
    code: 'OBJECT_KIND_MISMATCH',
    status: 400,
    origin: 'engine',
    doc: 'The handle exists but is a different kind (e.g. a swap quote passed to `sign-tx`).'
  },
  {
    code: 'OBJECT_SESSION_MISMATCH',
    status: 400,
    origin: 'engine',
    doc: 'The handle belongs to a different session.'
  },
  {
    code: 'OBJECT_WALLET_MISMATCH',
    status: 400,
    origin: 'engine',
    doc: 'The transaction handle belongs to a different wallet.'
  },
  {
    code: 'INVALID_SESSION',
    status: 401,
    origin: 'engine',
    doc: 'Unknown `sessionId`.'
  },
  {
    code: 'SESSION_EXPIRED',
    status: 401,
    origin: 'engine',
    doc: 'Auto-logged-out, or explicitly logged out.'
  },
  {
    code: 'NOT_FOUND',
    status: 404,
    origin: 'engine',
    doc: 'No route matched, or a generic missing resource.'
  },
  {
    code: 'NO_LOGIN_REQUEST',
    status: 404,
    origin: 'engine',
    doc: 'The lobby exists but carries no pending login request.'
  },
  {
    code: 'OBJECT_NOT_FOUND',
    status: 404,
    origin: 'engine',
    doc: 'No handle with that `objectId`.'
  },
  {
    code: 'PENDING_LOGIN_NOT_FOUND',
    status: 404,
    origin: 'engine',
    doc: 'No pending Edge login with that `pendingId`.'
  },
  {
    code: 'TOKEN_NOT_ENABLED',
    status: 404,
    origin: 'engine',
    doc: 'Tried to disable a token that was not enabled.'
  },
  {
    code: 'TOKEN_NOT_FOUND',
    status: 404,
    origin: 'engine',
    doc: 'Unknown token id for this wallet.'
  },
  {
    code: 'USER_NOT_FOUND',
    status: 404,
    origin: 'engine',
    doc: 'No local user matches that username or login id.'
  },
  {
    code: 'WALLET_NOT_FOUND',
    status: 404,
    origin: 'engine',
    doc: 'No wallet matches that id or prefix.'
  },
  {
    code: 'METHOD_NOT_ALLOWED',
    status: 405,
    origin: 'engine',
    doc: 'The path exists but not for this HTTP method.'
  },
  {
    code: 'AMBIGUOUS_WALLET_ID',
    status: 409,
    origin: 'engine',
    doc: 'A wallet id prefix matched more than one wallet.',
    details: '`details.candidates`'
  },
  {
    code: 'OBJECT_EXPIRED',
    status: 410,
    origin: 'engine',
    doc: 'The handle passed its 5 minute TTL and was released.'
  },
  {
    code: 'PAYLOAD_TOO_LARGE',
    status: 413,
    origin: 'engine',
    doc: 'Request body over 4 MiB.'
  },
  {
    code: 'UNSUPPORTED_MEDIA_TYPE',
    status: 415,
    origin: 'engine',
    doc: 'Body present but not `application/json`.'
  },
  {
    code: 'INTERNAL_ERROR',
    status: 500,
    origin: 'engine',
    doc: 'Unmapped engine or plugin failure.'
  },
  {
    code: 'ENGINE_SHUTTING_DOWN',
    status: 503,
    origin: 'engine',
    doc: 'Idle or explicit shutdown already in progress.'
  },

  {
    code: 'USERNAME_ERROR',
    status: 400,
    origin: 'core',
    doc: 'Unknown username, or an invalid recovery key.'
  },
  {
    code: 'NO_AMOUNT_SPECIFIED',
    status: 400,
    origin: 'core',
    doc: 'Zero-amount spend.'
  },
  {
    code: 'SAME_CURRENCY',
    status: 400,
    origin: 'core',
    doc: 'Swap between identical currencies.'
  },
  {
    code: 'PASSWORD_ERROR',
    status: 401,
    origin: 'core',
    doc: 'Wrong password, PIN, or recovery answers.',
    details: '`details.wait` (seconds) when rate-limited'
  },
  {
    code: 'OTP_REQUIRED',
    status: 401,
    origin: 'core',
    doc: 'Missing or wrong 2FA token.',
    details:
      '`reason` (`ip`\\|`otp`), `loginId`, `resetToken`, `resetDate`, `voucherId`, `voucherAuth`, `voucherActivates`'
  },
  {
    code: 'CHALLENGE_REQUIRED',
    status: 403,
    origin: 'core',
    doc: 'The login server wants a CAPTCHA. Retry with `challengeId`.',
    details: '`challengeId`, `challengeUri`'
  },
  {
    code: 'PIN_DISABLED',
    status: 403,
    origin: 'core',
    doc: 'PIN login is not enabled on this device.'
  },
  {
    code: 'SWAP_PERMISSION',
    status: 403,
    origin: 'core',
    doc: 'The swap plugin refused the request.',
    details:
      '`pluginId`, `reason`: `geoRestriction` \\| `noVerification` \\| `needsActivation`'
  },
  {
    code: 'INSUFFICIENT_FUNDS',
    status: 422,
    origin: 'core',
    doc: 'Not enough balance to cover amount plus fee.',
    details: '`tokenId`, `networkFee`'
  },
  {
    code: 'DUST_SPEND',
    status: 422,
    origin: 'core',
    doc: 'Amount below the network dust threshold.'
  },
  {
    code: 'PENDING_FUNDS',
    status: 422,
    origin: 'core',
    doc: 'Balance exists but is unconfirmed.'
  },
  {
    code: 'SPEND_TO_SELF',
    status: 422,
    origin: 'core',
    doc: 'Destination address belongs to the source wallet.'
  },
  {
    code: 'SWAP_ABOVE_LIMIT',
    status: 422,
    origin: 'core',
    doc: 'Amount exceeds the plugin maximum.',
    details: '`swapPluginId`, `nativeMax`, `direction`'
  },
  {
    code: 'SWAP_BELOW_LIMIT',
    status: 422,
    origin: 'core',
    doc: 'Amount below the plugin minimum.',
    details: '`swapPluginId`, `nativeMin`, `direction`'
  },
  {
    code: 'SWAP_CURRENCY',
    status: 422,
    origin: 'core',
    doc: 'The plugin does not support that pair.',
    details: '`pluginId`, `fromTokenId`, `toTokenId`'
  },
  {
    code: 'SWAP_ADDRESS',
    status: 422,
    origin: 'core',
    doc: 'Address unusable for this swap.',
    details: '`swapPluginId`, `reason`: `mustMatch` \\| `mustBeActivated`'
  },
  {
    code: 'OBSOLETE_API',
    status: 426,
    origin: 'core',
    doc: 'The login server rejected this client version.'
  },
  {
    code: 'NETWORK_ERROR',
    status: 503,
    origin: 'core',
    doc: 'Could not reach an Edge server.'
  }
]

/** Errors possible on any session-scoped route. */
export const SESSION_ERRORS = ['INVALID_SESSION', 'SESSION_EXPIRED']
/** Errors possible on any route with a `{walletId}` segment. */
export const WALLET_ERRORS = ['WALLET_NOT_FOUND', 'AMBIGUOUS_WALLET_ID']

export const CLI_EXIT_CODES = [
  { code: 0, name: 'OK', doc: 'Success.' },
  {
    code: 1,
    name: 'GENERIC',
    doc: 'Any failure with no more specific mapping.'
  },
  {
    code: 2,
    name: 'USAGE',
    doc: 'Bad argv: unknown flag, missing value, extra positional.'
  },
  {
    code: 3,
    name: 'AUTH',
    doc: '`INVALID_SESSION`, `SESSION_EXPIRED`, `PASSWORD_ERROR`, `OTP_REQUIRED`, `CHALLENGE_REQUIRED`, `PIN_DISABLED`.'
  },
  {
    code: 4,
    name: 'NOT_FOUND',
    doc: '`NOT_FOUND`, `WALLET_NOT_FOUND`, `TOKEN_NOT_FOUND`.'
  },
  {
    code: 5,
    name: 'VALIDATION',
    doc: '`BAD_REQUEST`, `INSUFFICIENT_FUNDS`, `DUST_SPEND`, `PENDING_FUNDS`, `SPEND_TO_SELF`, `NO_AMOUNT_SPECIFIED`, `AMBIGUOUS_WALLET_ID`, `USERNAME_ERROR`.'
  },
  {
    code: 6,
    name: 'NETWORK',
    doc: '`NETWORK_ERROR`, or any response with HTTP status `503`.'
  },
  { code: 7, name: 'ENGINE', doc: 'Could not connect to or spawn the engine.' }
]
