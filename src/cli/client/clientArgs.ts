/**
 * The client's global-flag parsers, each reporting the way bad argv is
 * reported: a `UsageError`, so the command exits 2 with a usage line.
 *
 * Out of `src/cli/index.ts`, which calls `main()` at import and so could not
 * be loaded by a test — it was 0% of 143 statements, and the `--timeout`
 * ceiling and the `CliConfigError` mapping both landed with nothing seeing
 * the client's exit code or its message. The engine's half of the same
 * ceiling already lives in an importable leaf, `requestBudget.ts`.
 */
import { UsageError } from '../command'
import { type CliConfig, CliConfigError, loadConfig } from '../engine/cliConfig'
import { errorMessage } from '../engine/errors'
import { parseTcpPort } from '../engine/tcpPort'
import { MAX_TIMER_MS } from '../timerCeiling'

/**
 * `--timeout=<seconds>`, as milliseconds.
 *
 * On expiry the client destroys its socket while the engine runs the request
 * to completion, so a caller needs to be able to ask for longer — the
 * documented "Expensive" routes and a whole-wallet `get-transactions` can
 * outrun the default, and for `broadcast-tx` the report would be a failure
 * after the funds had left.
 */
export function clientTimeoutMs(raw: string | undefined): number | undefined {
  if (raw == null) return undefined
  const seconds = Number(raw)
  if (!Number.isFinite(seconds) || seconds <= 0) {
    throw new UsageError(
      undefined,
      `Invalid --timeout "${raw}": expected a positive number of seconds`
    )
  }
  const ms = seconds * 1000
  // Node holds a timer's delay in a signed 32-bit integer, so
  // `http.request({ timeout })` above the ceiling warns and *clamps to
  // 1 ms*: `--timeout=1e9`, which is how a caller asks for "effectively
  // never" on the `broadcast-tx` this flag exists for, failed instantly
  // with `REQUEST_TIMEOUT` and exit 6 — the exact opposite. Refused rather
  // than clamped down, because silently waiting 24 days less than asked is
  // the same class of surprise. `MAX_TIMER_MS` is the ceiling the engine
  // already applies to the budget header this value becomes, in
  // `requestBudget.ts`.
  if (ms > MAX_TIMER_MS) {
    throw new UsageError(
      undefined,
      `Invalid --timeout "${raw}": at most ${Math.floor(
        MAX_TIMER_MS / 1000
      )} seconds, Node's timer ceiling`
    )
  }
  return ms
}

/**
 * The `--tcp` port, validated here rather than forwarded.
 *
 * The shared validator, reported the way the client reports bad argv:
 * `Number('abc')` is `NaN`, which reached the engine as `--tcp=NaN` and cost
 * the caller a 30-second spawn timeout followed by the engine's stack inside
 * the error envelope.
 */
export function clientTcpPort(raw: string | undefined): number | null {
  try {
    return parseTcpPort(raw)
  } catch (error: unknown) {
    throw new UsageError(undefined, errorMessage(error))
  }
}

/**
 * The config file, with an unreadable one reported as bad argv.
 *
 * An explicit `-c` that is not there is an argv mistake. A plain `Error`
 * here printed an `INTERNAL_ERROR` envelope and exited 1 for a typo in a
 * path, with no usage line.
 */
export function clientConfig(configPath: string | undefined): CliConfig {
  try {
    return loadConfig(configPath)
  } catch (error: unknown) {
    if (!(error instanceof CliConfigError)) throw error
    throw new UsageError(undefined, error.message)
  }
}

/**
 * What the legacy `-u`/`-p` helper does for a command that needs a session.
 *
 * It used to run only when there was no session at all, and the session
 * file is per profile, not per user — so once any account had logged in on
 * a profile, `-u alice -p … delete-remote-account --yes` ran against the
 * account already there, bob's, and exited 0. The helper's one job is to
 * choose the account, so a session held by someone else is not used for it:
 * with `-p` it logs in as the named user, and without one it refuses, naming
 * both.
 *
 * `heldBy` is the username the session file records for the session in use,
 * or `undefined` when the session came from `--session` or
 * `EDGE_CLI_SESSION`, whose account the client cannot see.
 */
export function legacyLoginAction(opts: {
  username: string | undefined
  password: string | undefined
  sessionId: string | null
  heldBy: string | undefined
}):
  | { kind: 'use-session' }
  | { kind: 'login' }
  | { kind: 'refuse'; reason: string } {
  const { username, password, sessionId, heldBy } = opts
  // As core spells them: `account.username` is the name passed through its
  // `fixUsername`, so `-u Alice` never equalled the `alice` the session file
  // recorded, and every command logged in again.
  if (
    sessionId != null &&
    (username == null || (heldBy != null && sameUsername(heldBy, username)))
  ) {
    return { kind: 'use-session' }
  }
  if (username != null && password != null) return { kind: 'login' }
  if (sessionId == null) {
    return { kind: 'refuse', reason: 'Please log in first (no sessionId)' }
  }
  return {
    kind: 'refuse',
    reason:
      `-u ${username} was given, but the session in use belongs to ` +
      `${heldBy ?? 'an account this client cannot name'}. Pass -p to log ` +
      `in as ${username} for this command, or drop -u.`
  }
}

/** Two usernames as core compares them: case and spacing do not count. */
export function sameUsername(a: string, b: string): boolean {
  const fix = (name: string): string =>
    name
      .toLowerCase()
      .replace(/[ \f\r\n\t\v]+/g, ' ')
      .trim()
  return fix(a) === fix(b)
}
