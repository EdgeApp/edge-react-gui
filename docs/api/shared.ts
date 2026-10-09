import { EXIT, exitCodeForApiError } from '../../src/cli/client/exitCodes'

/**
 * The error catalogue and the CLI exit-code table.
 *
 * Response shapes used to live here too; they are now cleaners in
 * `src/cli/engine/schemas.ts`, where they both validate and describe.
 */

export interface ErrorCode {
  code: string
  status: number
  origin: 'engine' | 'core' | 'client'
  doc: string
  details?: string
}

/**
 * Every code the CLI can emit. Engine codes are thrown by `engineError`;
 * core codes are mapped from `edge-core-js` error types by `mapCoreError`;
 * client codes are written by `src/cli/client/output.ts` and never cross the
 * wire, but a script matching on `error.code` sees them all the same, so
 * leaving them out published a program whose failures the catalogue could
 * not describe.
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
    doc: 'Auto-logged-out after the account\u2019s idle timeout. An explicitly logged-out session is gone rather than expired, and answers `INVALID_SESSION`.'
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
    code: 'TOKEN_NOT_FOUND',
    status: 404,
    origin: 'engine',
    doc: 'Unknown token id for this wallet.'
  },
  {
    code: 'UNAUTHORIZED',
    status: 401,
    origin: 'engine',
    doc: 'The TCP transport requires the bearer token from the engine run file in an `X-Edge-Token` header. The unix socket needs none: its `0600` mode is the check.'
  },
  {
    code: 'FORBIDDEN',
    status: 403,
    origin: 'engine',
    doc: 'A TCP request carried an `Origin` header, or a `Host` that is not the address the listener is bound to. Both are refused so a web page cannot reach the engine, directly or by rebinding a name onto its port.'
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
    code: 'ENGINE_UNAVAILABLE',
    status: 503,
    origin: 'client',
    doc: 'The client could not reach or start an engine. Written by the client, so it never arrives over the wire; exit code 7.'
  },
  {
    code: 'USAGE',
    status: 400,
    origin: 'client',
    doc: 'Bad argv: an unknown command or flag, a missing flag value, or an unparseable structured flag. Written by the client; exit code 2.'
  },
  {
    code: 'METHOD_NOT_ALLOWED',
    status: 405,
    origin: 'engine',
    doc: 'The path exists but not for this HTTP method.'
  },
  {
    code: 'WALLET_NOT_RUNNING',
    status: 409,
    origin: 'engine',
    doc: 'The wallet exists in the account but has no running engine — archived, paused, or its currency plugin is not loaded — and the call needs one. The display-key routes answer this where the raw-key routes succeed.'
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
    doc: 'The handle was read after its TTL but before the 15-second sweeper released it. Once swept it is gone, so a handle past its TTL usually answers `OBJECT_NOT_FOUND` instead.'
  },
  {
    code: 'OBJECT_IN_USE',
    status: 409,
    origin: 'engine',
    doc: 'A consuming call on this handle is already in flight. Fund-moving calls outlive the client socket timeout, so a retry is refused rather than sending twice.'
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
    doc: 'Unknown username, or an invalid recovery key. On `fetch-recovery-questions` it also means "no recovery is set up for this account", which the login server reports with the message `Account does not exist on server` — so the message can name an account that does exist.'
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
    details:
      '`swapPluginId`, `nativeMin`, `direction`. `nativeMin` is an empty string when the plugin refused the amount without reporting a limit — core defaults it, and the engine passes it through rather than inventing one.'
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
  },
  {
    code: 'REQUEST_TIMEOUT',
    status: 504,
    origin: 'client',
    doc: 'The client\u2019s own `--timeout` expired. No response arrived, and the engine is still running the request to completion \u2014 so the command may yet take effect. Written by the client, so it never arrives over the wire; exit code 6. It used to be reported as `INTERNAL_ERROR` with a fabricated `status: 500`, which said the engine had answered when nothing had.'
  },
  {
    code: 'CONNECTION_CLOSED',
    status: 503,
    origin: 'client',
    doc: 'The engine closed the connection while answering. The command may or may not have taken effect. Written by the client; exit code 6.'
  },
  {
    code: 'RATES_INCOMPLETE',
    status: 503,
    origin: 'engine',
    doc: 'The historical-rate queue gave up before every date was priced, so an `exportFormat` export would have carried a zero fiat amount for part of the range. `details.unavailable` and `details.asked` say how much. Raise `--timeout`, which now raises the rate queue\u2019s own budget with it, or narrow the date range. A listing answers instead, with `unpricedCount` set.'
  }
]

// Re-exported from the runtime module the routes import, so the reference and
// the declarations cannot disagree about what is in each group.
export {
  HANDLE_ERRORS,
  SESSION_ERRORS,
  WALLET_ERRORS
} from '../../src/cli/engine/errorGroups'

/**
 * The error codes that map to one exit code, as the reference renders them.
 *
 * Over the catalogue rather than over `EXIT_CODE_BY_ERROR`, because a code's
 * exit is now the explicit row *or* its status — so the list the reference
 * publishes is complete by construction. Built from `EXIT_CODE_BY_ERROR`
 * alone it was short by the nine codes that take the status fallback.
 */
function codeList(exitCode: number): string {
  return errorCodes
    .filter(entry => exitCodeForApiError(entry.code, entry.status) === exitCode)
    .map(entry => `\`${entry.code}\``)
    .join(', ')
}

/**
 * The published exit-code table.
 *
 * The membership of codes 3 to 6 comes from `EXIT_CODE_BY_ERROR`, the same
 * table `output.ts` chooses the code from, so the reference cannot drift from
 * the implementation. Only the prose that is *not* a membership list is
 * written here.
 */
export const CLI_EXIT_CODES = [
  { code: EXIT.OK, name: 'OK', doc: 'Success.' },
  {
    code: EXIT.GENERIC,
    name: 'GENERIC',
    doc: `Any failure with no more specific mapping: ${codeList(
      EXIT.GENERIC
    )}. Every other published code resolves to one of the codes below, by an explicit row or by its HTTP status.`
  },
  {
    code: EXIT.USAGE,
    name: 'USAGE',
    doc: `Bad argv \u2014 unknown flag, missing value, extra positional: ${codeList(
      EXIT.USAGE
    )}. Written by the client before any request is made.`
  },
  { code: EXIT.AUTH, name: 'AUTH', doc: `${codeList(EXIT.AUTH)}.` },
  {
    code: EXIT.NOT_FOUND,
    name: 'NOT_FOUND',
    doc: `${codeList(EXIT.NOT_FOUND)}.`
  },
  {
    code: EXIT.VALIDATION,
    name: 'VALIDATION',
    doc: `${codeList(EXIT.VALIDATION)}.`
  },
  {
    code: EXIT.NETWORK,
    name: 'NETWORK',
    doc: `${codeList(EXIT.NETWORK)}, or any response with HTTP status \`503\`.`
  },
  {
    code: EXIT.ENGINE,
    name: 'ENGINE',
    doc: `${codeList(
      EXIT.ENGINE
    )} \u2014 the daemon is going away, or the client could not connect to or spawn one.`
  }
]
