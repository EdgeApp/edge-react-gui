import { hasOwn } from '../util/predicates'
import { type Command, UsageError } from './command'
import { emptyToUndefined } from './envValue'
import { takeFlagValue } from './flagTable'
import { secretEnvFor } from './secretFlags'

export type FlagKind = 'string' | 'boolean' | 'repeat' | 'boolstr'

/**
 * A flag's value as JSON, reported as bad argv when it is not.
 *
 * Here rather than in `generated.ts`, because a hand-written command needs
 * the same thing: `change-wallet-states` publishes `--wallet-states` as a
 * JSON body field, so its parser has to read one the same way the generated
 * commands read `--spend-info` and `--lobby-request`.
 */
export function parseJsonFlag(
  raw: string,
  what: string,
  cmd: Command
): unknown {
  try {
    return JSON.parse(raw)
  } catch {
    // `cmd`, not `undefined`: every sibling throw passes it, so
    // `--metadata '{bad'` printed no usage line where a *missing*
    // `--metadata` did.
    throw new UsageError(cmd, `--${what} must be valid JSON`)
  }
}

export interface ParseSpec {
  /**
   * Defaults to `'none'`; set `'required'` or `'optional'` for a command
   * that takes one.
   *
   * Omitting it means any positional argument is bad argv, which is the
   * opposite of what this comment used to promise.
   */
  positional?: 'required' | 'optional' | 'none'
  flags?: Record<string, FlagKind>
}

export interface ParsedCommandArgs {
  positional?: string
  string: (name: string) => string | undefined
  requireString: (name: string) => string
  /**
   * A secret flag's value: the flag, or the variable named for it.
   *
   * `ps` shows a command line to every user on the host, so a password, a
   * PIN, a login key or a repo data key must have a path that is not argv —
   * which is the rule `spawnEngine.ts` already states for the API key. The
   * flag wins when both are given.
   */
  secret: (name: string) => string | undefined
  requireSecret: (name: string) => string
  strings: (name: string) => string[]
  boolean: (name: string) => boolean
  boolstr: (name: string) => boolean | undefined
  booleanGiven: (name: string) => boolean
}

/** A secret flag's value from its own variable, if it has one. */
function secretFromEnv(flag: string): string | undefined {
  const name = secretEnvFor(flag)
  return name == null ? undefined : emptyToUndefined(process.env[name])
}

function parseBoolstr(cmd: Command, name: string, raw: string): boolean {
  if (raw === 'true' || raw === '1') return true
  if (raw === 'false' || raw === '0') return false
  throw new UsageError(cmd, `--${name} must be true or false`)
}

/**
 * Parse command-local argv after the command name.
 * `--name=value` is preferred; `--name value` is accepted.
 * A bare boolean flag means true, and `--flag=true|false|1|0` is accepted —
 * which is how a caller turns off a field the server defaults to true, as
 * `[--dry-run[=false]]` in the published usage says.
 */
export function parseCommandArgs(
  cmd: Command,
  argv: string[],
  spec: ParseSpec
): ParsedCommandArgs {
  const positionalMode = spec.positional ?? 'none'
  const strings: Record<string, string[]> = Object.create(null)
  const booleans: Record<string, boolean> = Object.create(null)
  let positional: string | undefined
  let sawPositional = false

  // One rule, from the table: `flagTable.ts` owns "the token after a flag,
  // refused when it is missing, empty or itself a flag", because the client's
  // global parser and the engine's each had their own copy of it and two of
  // the three carried a comment saying they had to agree. `''` as well as
  // absent, matching the `=` branch: without it `--wallet-id=` was a local
  // usage error at exit 2 and `--wallet-id ""` spawned an engine and came
  // back `BAD_REQUEST` at exit 5 — one spelling of one mistake answered two
  // ways by one function.
  const takeValue = (
    name: string,
    i: number
  ): { value: string; next: number } =>
    takeFlagValue(argv, i, `--${name}`, {
      reject: message => {
        throw new UsageError(cmd, message)
      },
      missing: () => `--${name} requires a value`
    })

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (arg === '--') {
      throw new UsageError(cmd, 'Unexpected --')
    }
    if (arg.startsWith('--')) {
      const name = arg.slice(2).split('=')[0]
      // `hasOwn`, because `name` is argv and `spec.flags` is a plain literal:
      // for `--constructor` or `--toString` the lookup found an inherited
      // `Object.prototype` member, so the `kind == null` test below never
      // fired and the flag was accepted and silently ignored — where every
      // other unknown flag is a usage error. Two sites in this file already
      // say this; this is the one whose key comes from the command line.
      const kind = hasOwn(spec.flags ?? {}, name)
        ? spec.flags?.[name]
        : undefined
      if (kind == null) {
        throw new UsageError(cmd, `Unknown option --${name}`)
      }
      if (kind === 'boolean') {
        // A bare `--flag` means true, and `--flag=false` is how a caller
        // turns off a field the server defaults to true. Refusing the value
        // form left `--broadcast` and `--save` inert on `spend`, with no CLI
        // path to a sign-only or a no-save spend although the usage line
        // advertised both.
        if (arg.includes('=')) {
          const raw = arg.slice(arg.indexOf('=') + 1)
          booleans[name] = parseBoolstr(cmd, name, raw)
        } else {
          booleans[name] = true
        }
        continue
      }
      const { value, next } = takeValue(name, i)
      i = next
      if (kind === 'repeat') {
        strings[name] = [...(strings[name] ?? []), value]
      } else {
        strings[name] = [value]
      }
      continue
    }
    if (arg.startsWith('-')) {
      throw new UsageError(cmd, `Unknown option ${arg}`)
    }
    if (positionalMode === 'none' || sawPositional) {
      throw new UsageError(cmd)
    }
    positional = arg
    sawPositional = true
  }

  if (positionalMode === 'required' && positional == null) {
    throw new UsageError(cmd)
  }

  return {
    positional,
    string: name => strings[name]?.[0],
    requireString: name => {
      const value = strings[name]?.[0]
      if (value == null) throw new UsageError(cmd, `Missing --${name}`)
      return value
    },
    secret: name => strings[name]?.[0] ?? secretFromEnv(name),
    requireSecret: name => {
      const value = strings[name]?.[0] ?? secretFromEnv(name)
      if (value == null) {
        const env = secretEnvFor(name)
        throw new UsageError(
          cmd,
          env == null
            ? `Missing --${name}`
            : `Missing --${name} (or set ${env})`
        )
      }
      return value
    },
    strings: name => strings[name] ?? [],
    boolean: name => booleans[name] ?? false,
    /** Whether the flag was given at all, however it was spelled. */
    booleanGiven: name => booleans[name] !== undefined,
    boolstr: name => {
      const raw = strings[name]?.[0]
      if (raw == null) return undefined
      return parseBoolstr(cmd, name, raw)
    }
  }
}
