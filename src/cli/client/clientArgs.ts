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
 * What the legacy `-u`/`-p` helper does once no session is the named user's.
 *
 * It used to run only when there was no session at all, and the session
 * file is per profile, not per user — so once any account had logged in on
 * a profile, `-u alice -p … delete-remote-account --yes` ran against the
 * account already there, bob's, and exited 0. The helper's one job is to
 * choose the account. `ensureNamedSession` asks the engine whose the
 * session in use and the saved session are, and uses either when it is the
 * named user's; it calls this only when neither is. Then, with `-p`, it logs
 * in as the named user, and that session replaces the profile's saved one;
 * without `-p` it refuses, naming the holder or saying the session is no
 * longer live. Without `-u` the session in use is simply used.
 *
 * `heldBy` is the username of the session in use, as the engine reports it,
 * for the refusal; `undefined` when it has none (a light account). `dead`
 * is set when the engine no longer knows the id — logged out or expired.
 */
export function legacyLoginAction(opts: {
  username: string | undefined
  password: string | undefined
  sessionId: string | null
  heldBy: string | undefined
  dead?: boolean
}):
  | { kind: 'use-session' }
  | { kind: 'login' }
  | { kind: 'refuse'; reason: string } {
  const { username, password, sessionId, heldBy, dead = false } = opts
  if (sessionId != null && !dead && username == null) {
    return { kind: 'use-session' }
  }
  if (username != null && password != null) return { kind: 'login' }
  if (sessionId == null) {
    return { kind: 'refuse', reason: 'Please log in first (no sessionId)' }
  }
  const loginHint =
    `Pass -p (or set EDGE_CLI_PASSWORD) to log in as ${String(username)} — ` +
    'that session then replaces the saved one'
  if (dead) {
    return {
      kind: 'refuse',
      reason:
        `-u ${String(username)} was given, but the session in use is no ` +
        `longer live (logged out or expired). ${loginHint}.`
    }
  }
  return {
    kind: 'refuse',
    reason:
      `-u ${String(username)} was given, but the session in use belongs to ` +
      `${heldBy ?? 'an account with no username'}. ${loginHint} — or drop -u.`
  }
}

/**
 * Which session a `-u` login logs out, if any, when it replaces the saved
 * one.
 *
 * Only a session an earlier `-u` logged in (`namedLogin`): an id a plain
 * login printed is one any shell may have exported. And only when it is
 * still the session the file held when this command started — one another
 * shell's `-u` wrote meanwhile is that shell's, in use right now — when it
 * is not the new session, not one this command pinned with `--session` or
 * `EDGE_CLI_SESSION`, and not one the engine already said it does not know.
 */
export function sessionToLogOut(opts: {
  replaced: { sessionId: string; namedLogin?: boolean } | null
  savedAtStart: { sessionId: string } | null
  newSessionId: string
  pinned: readonly string[]
  dead: ReadonlySet<string>
}): string | undefined {
  const { replaced, savedAtStart, newSessionId, pinned, dead } = opts
  if (replaced == null || replaced.namedLogin !== true) return
  const id = replaced.sessionId
  if (id !== savedAtStart?.sessionId) return
  if (id === newSessionId || pinned.includes(id) || dead.has(id)) return
  return id
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
