/**
 * Minimal argv parser replacing node-getopt (which emits DEP0128 because its
 * package.json has `"main": "./lib"` instead of a file path).
 */
import { hasCommand, UsageError } from './command'
import { errorMessage } from './engine/errors'
import { EXAMPLE_TCP_PORT, parseTcpPort } from './engine/tcpPort'
import {
  GLOBAL_FLAGS,
  matchFlag,
  renderFlagHelp,
  takeFlagValue
} from './flagTable'

export interface CliOptions {
  'api-key'?: string
  'app-id'?: string
  config?: string
  directory?: string
  username?: string
  password?: string
  test?: boolean
  fake?: boolean
  session?: string
  'no-spawn'?: boolean
  'solve-captcha'?: boolean
  tcp?: string
  timeout?: string
  help?: boolean
}

export interface ParsedArgs {
  options: CliOptions
  argv: string[]
}

const HELP_TEXT = `Usage: edge-cli [options] [command] [args...]

Options:
${renderFlagHelp('client')}
`

/**
 * The flag an argument names, by any spelling the table gives it.
 *
 * This parser used to restate `flagTable.ts` by hand: five copy-pasted
 * boolean arms and eight copy-pasted valued ones, each three lines differing
 * only in the flag's name and the field it writes. That made three
 * descriptions of one flag set — the table, the guide, and this — of which
 * `verifyApiDocs.ts` could check only the first two, and the drift it could
 * not see was real: `-k`/`-a`/`-c`/`-d`/`-u`/`-p` took `--long=value` but not
 * `-k=value`, which no table entry or help line mentioned.
 *
 * `matchFlag` and `takeFlagValue` live in the table itself, because the
 * engine's parser needs the same two rules and had its own copy of each.
 */
const takeValue = (
  argv: string[],
  i: number,
  flag: string
): { value: string; next: number } =>
  takeFlagValue(argv, i, flag, {
    reject: message => {
      throw new UsageError(undefined, message)
    },
    // `edge-cli --directory balance-map` means a forgotten value, not a
    // directory called `balance-map`: taking it silently swallowed the
    // command and dropped the caller into the interactive prompt with exit 0.
    isCommand: hasCommand
  })

/** The flags this parser drives itself; `--tcp` validates its own value. */
const CLIENT_FLAGS = GLOBAL_FLAGS.filter(
  flag => flag.who !== 'engine' && flag.custom !== true
)

export function parseCliArgs(argv: string[]): ParsedArgs {
  const options: CliOptions = {}
  // The table names each field as a string, so the writes go through one
  // cast rather than one per flag. Every name is checked against this type
  // by `parseArgs.test.ts`, which fails on a field no `CliOptions` key
  // matches.
  const fields = options as Record<string, string | boolean | undefined>
  const positional: string[] = []

  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]

    if (a === '--') {
      positional.push(...argv.slice(i + 1))
      break
    }

    // `--tcp` first, because its value is a port and the message for a
    // missing one names the port rather than the flag. The same validator
    // the engine uses, so one spelling cannot be accepted here and refused
    // there.
    if (a === '--tcp' || a.startsWith('--tcp=')) {
      if (a === '--tcp') {
        throw new UsageError(
          undefined,
          `--tcp requires a port, e.g. --tcp=${EXAMPLE_TCP_PORT}`
        )
      }
      // Validated here, where every other bad flag is reported, rather than
      // only when `buildContext` converts it: `--tcp=` stored an empty
      // string that silently meant "no listener" on one side of the parse
      // and bad argv on the other.
      const raw = a.slice('--tcp='.length)
      try {
        parseTcpPort(raw)
      } catch (error: unknown) {
        throw new UsageError(undefined, errorMessage(error))
      }
      options.tcp = raw
      continue
    }

    const flag = matchFlag(CLIENT_FLAGS, a)
    if (flag != null) {
      if (!flag.takesValue) {
        // Every boolean the client takes names its own field.
        fields[flag.clientField!] = true
        continue
      }
      const { value, next } = takeValue(argv, i, flag.long)
      // `--locale` is consumed and not recorded: `detectNodeLocale` reads it
      // off argv itself, from `bootNodeLocale`, which runs before this
      // parser. A field here would be written and never read.
      if (flag.clientField != null) fields[flag.clientField] = value
      i = next
      continue
    }

    if (a.startsWith('-')) {
      // Always: every other path that fills `positional` breaks out of the
      // loop, so nothing can reach here with one already collected. The
      // branch this replaces claimed to handle a command-local flag after
      // the command name, which the `argv.slice(i + 1)` below has already
      // swallowed by then.
      throw new UsageError(undefined, `Unknown option: ${a}`)
    }

    // First non-option is the command name; remaining args (including
    // flags) belong to the command.
    positional.push(a)
    positional.push(...argv.slice(i + 1))
    break
  }

  return { options, argv: positional }
}

export function showCliHelp(): void {
  console.log(HELP_TEXT)
}
