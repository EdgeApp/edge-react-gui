/**
 * The engine's argv, and nothing else.
 *
 * Its own module so it can be tested: `index.ts` runs `main()` as a side
 * effect of being imported, so nothing could reach the parser - and what it
 * decides is the engine's whole command-line contract, including which
 * profile a client will find. Every corner it was hardened against was
 * recorded as a comment and nothing else.
 *
 * The flags themselves are declared once, in `src/cli/flagTable.ts`, which
 * also renders both help texts and is checked against `docs/EDGE_CLI.md` in
 * both directions.
 */
import { GLOBAL_FLAGS, matchFlag, takeFlagValue } from '../flagTable'
import { errorMessage } from './errors'
import { MAX_TIMER_MS } from './schemas'
import { EXAMPLE_TCP_PORT, parseTcpHost, parseTcpPort } from './tcpPort'

export interface EngineArgs {
  testMode: boolean
  fake: boolean
  directory?: string
  appId?: string
  apiKey?: string
  locale?: string
  tcpPort: number | null
  tcpHost: string
  idleTimeoutSeconds: number
  configPath?: string
  help: boolean
}

/** An inline `--flag=` value, refused when empty. */
function requireNonEmpty(value: string, flag: string): string {
  if (value === '') throw new EngineUsageError(`${flag} requires a value`)
  return value
}

/**
 * The `--idle-timeout` value, validated once for both spellings.
 *
 * It was written out twice in the same function with error text that
 * disagreed, and neither copy refused an empty value: `Number('')` is `0`,
 * which is documented as "never", so `--idle-timeout=` produced an immortal
 * daemon holding an `EdgeContext` and a logged-in account open, silently.
 */
function parseIdleTimeout(raw: string | undefined): number {
  if (raw == null || raw === '') {
    throw new EngineUsageError(
      '--idle-timeout requires a value in seconds, where 0 means never'
    )
  }
  const seconds = Number(raw)
  if (!Number.isFinite(seconds) || seconds < 0) {
    throw new EngineUsageError(`Invalid --idle-timeout: ${raw}`)
  }
  // Refused rather than clamped. `setTimeout` holds its delay in a 32-bit
  // signed integer, so `seconds * 1000` above the ceiling becomes **1 ms**
  // after a `TimeoutOverflowWarning` — `--idle-timeout=2592000` ("keep it
  // up for a month", when the documented way to say never is `0`) shut the
  // engine down the instant it went idle, and the only notice was that
  // warning, on a stderr that goes to a startup log a clean stop deletes.
  // Silently clamping to the ceiling would be a different number from the
  // one asked for; `0` is the way to say never.
  if (seconds * 1000 > MAX_TIMER_MS) {
    throw new EngineUsageError(
      `--idle-timeout must be at most ${Math.floor(
        MAX_TIMER_MS / 1000
      )} seconds, or 0 for never`
    )
  }
  return seconds
}

/** Bad argv for the engine: reported cleanly, not as a crash. */
export class EngineUsageError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'EngineUsageError'
  }
}

/**
 * The flags this parser drives from the table.
 *
 * Three are `custom` and keep their own arms below, because each validates
 * its value as it reads it and says something specific when it is wrong: a
 * TCP port, a loopback bind host, a timeout in seconds where 0 means never.
 * All three still take their value through `takeFlagValue` or
 * `requireNonEmpty`,
 * so a forgotten value gets the same message it gets anywhere else.
 *
 * `--tcp` and `--tcp-host` accept only the `=` spelling, which is how the
 * help line and the guide's table spell them; `--idle-timeout` accepts both.
 */
const ENGINE_FLAGS = GLOBAL_FLAGS.filter(
  flag => flag.who !== 'client' && flag.custom !== true
)

export function parseEngineArgs(argv: string[]): EngineArgs {
  const args: EngineArgs = {
    testMode: false,
    fake: false,
    tcpPort: null,
    tcpHost: '127.0.0.1',
    idleTimeoutSeconds: 300,
    help: false
  }

  // The table names each field as a string, so the writes go through one
  // cast rather than one per flag. `engineArgs.test.ts` fails on a field no
  // `EngineArgs` key matches.
  const fields = args as unknown as Record<string, string | boolean | number>

  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    // One match against the table, not five side-effecting probes. Each
    // probe consumed its argument by mutating `i`, and they all ran at the
    // top of every iteration — so every probe after the one that matched
    // re-read `argv[i]`, which by then pointed at the *value* the previous
    // probe had taken. Nothing went wrong only because `takeFlagValue`
    // refuses a value beginning with `-`, an invariant that lived in another
    // function: one valued flag whose value may legitimately start with `-`
    // and the parser would read values as flags, in an order decided by
    // which probe came first.
    const flag = matchFlag(ENGINE_FLAGS, a)
    if (flag != null) {
      if (!flag.takesValue) {
        fields[flag.engineField!] = true
        continue
      }
      // Both spellings through one rule, which lives in the table beside
      // `matchFlag` because the client's parser needs the same two.
      const taken = takeFlagValue(argv, i, a, {
        reject: message => {
          throw new EngineUsageError(message)
        },
        missing: name => `${name} requires a value`
      })
      i = taken.next
      fields[flag.engineField!] = taken.value
      continue
    }
    if (a === '--tcp') {
      throw new EngineUsageError(
        `--tcp requires a port, e.g. --tcp=${EXAMPLE_TCP_PORT}`
      )
    }
    if (a.startsWith('--tcp=')) {
      // The same validator the client uses, so one spelling cannot be
      // accepted here and refused there.
      try {
        args.tcpPort = parseTcpPort(a.slice('--tcp='.length))
      } catch (error: unknown) {
        throw new EngineUsageError(errorMessage(error))
      }
      continue
    }
    if (a.startsWith('--tcp-host=')) {
      // Node's `server.listen(port, '')` takes the falsy-host branch and
      // binds the unspecified address, so `--tcp-host=` used to publish the
      // engine on every interface. An explicit non-loopback address did the
      // same thing and was the bigger hole: the help text, the guide and this
      // code's own intent all say loopback, and an engine reachable from the
      // LAN exposes `get-raw-private-key` and `spend` to it.
      // The one place the spelling is canonicalised, shared with the port
      // validator so neither entry can disagree about what is accepted.
      try {
        args.tcpHost = parseTcpHost(
          requireNonEmpty(a.slice('--tcp-host='.length), '--tcp-host')
        )
      } catch (error: unknown) {
        if (error instanceof RangeError) {
          throw new EngineUsageError(error.message)
        }
        throw error
      }
      continue
    }
    if (a === '--idle-timeout' || a.startsWith('--idle-timeout=')) {
      // One arm, and the value taken the same way every other valued flag
      // takes it: the space form used to read `argv[++i]` directly, so
      // `--idle-timeout --tcp=9312` answered "Invalid --idle-timeout:
      // --tcp=9312" where `takeFlagValue` answers "requires a value" for
      // exactly that mistake.
      const eq = a.indexOf('=')
      // The `=` form goes straight to `parseIdleTimeout`, whose own empty
      // check says what the value means — "in seconds, where 0 means never"
      // — rather than the generic line.
      let raw: string
      if (eq === -1) {
        const taken = takeFlagValue(argv, i, a, {
          reject: message => {
            throw new EngineUsageError(message)
          },
          missing: name => `${name} requires a value`
        })
        i = taken.next
        raw = taken.value
      } else {
        raw = a.slice(eq + 1)
      }
      args.idleTimeoutSeconds = parseIdleTimeout(raw)
      continue
    }
    throw new EngineUsageError(`Unknown argument: ${a}`)
  }
  return args
}
