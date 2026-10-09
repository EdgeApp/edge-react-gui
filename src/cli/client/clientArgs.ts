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
