/**
 * The error catalogue and the CLI exit-code table.
 *
 * Response shapes used to live here too; they are now cleaners in
 * `src/cli/engine/schemas.ts`, where they both validate and describe.
 */

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
