/**
 * Minimal argv parser replacing node-getopt (which emits DEP0128 because its
 * package.json has `"main": "./lib"` instead of a file path).
 */
import { hasCommand, UsageError } from './command'
import { EXAMPLE_TCP_PORT, parseTcpPort } from './engine/tcpPort'
import { renderFlagHelp } from './flagTable'

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

function takeValue(
  argv: string[],
  i: number,
  flag: string
): { value: string; next: number } {
  const cur = argv[i]
  const eq = cur.indexOf('=')
  if (eq !== -1) {
    const value = cur.slice(eq + 1)
    // `--directory=` is not a directory. The client and the engine both hash
    // the profile from it, so an empty one on this side and a default on the
    // other are two different engines.
    if (value === '') {
      throw new UsageError(undefined, `Missing value for ${flag}`)
    }
    return { value, next: i }
  }
  const next = argv[i + 1]
  // `''` as well as absent: `-d ""` is the same forgotten value as
  // `--directory=`, and it reached the profile hash as an empty directory
  // while the engine used its default — two different engines, and a
  // 30-second spawn timeout with a healthy engine running. The `=` form
  // already refused it; the space form did not.
  if (next == null || next === '' || next.startsWith('-')) {
    throw new UsageError(undefined, `Missing value for ${flag}`)
  }
  // `edge-cli --directory balance-map` means a forgotten value, not a
  // directory called `balance-map`: taking it silently swallowed the command
  // and dropped the caller into the interactive prompt with exit 0.
  if (hasCommand(next)) {
    throw new UsageError(
      undefined,
      `Missing value for ${flag}: "${next}" is a command. Write ${flag}=<value>.`
    )
  }
  return { value: next, next: i + 1 }
}

export function parseCliArgs(argv: string[]): ParsedArgs {
  const options: CliOptions = {}
  const positional: string[] = []

  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]

    if (a === '--') {
      positional.push(...argv.slice(i + 1))
      break
    }

    if (a === '-h' || a === '--help') {
      options.help = true
      continue
    }
    if (a === '-t' || a === '--test') {
      options.test = true
      continue
    }
    if (a === '--fake') {
      options.fake = true
      continue
    }
    if (a === '--no-spawn') {
      options['no-spawn'] = true
      continue
    }
    if (a === '--solve-captcha') {
      options['solve-captcha'] = true
      continue
    }

    if (a === '-k' || a === '--api-key' || a.startsWith('--api-key=')) {
      const { value, next } = takeValue(argv, i, '--api-key')
      options['api-key'] = value
      i = next
      continue
    }
    if (a === '-a' || a === '--app-id' || a.startsWith('--app-id=')) {
      const { value, next } = takeValue(argv, i, '--app-id')
      options['app-id'] = value
      i = next
      continue
    }
    if (a === '-c' || a === '--config' || a.startsWith('--config=')) {
      const { value, next } = takeValue(argv, i, '--config')
      options.config = value
      i = next
      continue
    }
    if (a === '-d' || a === '--directory' || a.startsWith('--directory=')) {
      const { value, next } = takeValue(argv, i, '--directory')
      options.directory = value
      i = next
      continue
    }
    if (a === '-u' || a === '--username' || a.startsWith('--username=')) {
      const { value, next } = takeValue(argv, i, '--username')
      options.username = value
      i = next
      continue
    }
    if (a === '-p' || a === '--password' || a.startsWith('--password=')) {
      const { value, next } = takeValue(argv, i, '--password')
      options.password = value
      i = next
      continue
    }
    if (a === '--session' || a.startsWith('--session=')) {
      const { value, next } = takeValue(argv, i, '--session')
      options.session = value
      i = next
      continue
    }
    if (a === '--locale' || a.startsWith('--locale=')) {
      // Consumed so it is not an unknown option, and *not* recorded:
      // `detectNodeLocale` reads argv itself, from `bootNodeLocale`, which
      // runs before this parser. A field here would be written and never
      // read.
      const { next } = takeValue(argv, i, '--locale')
      i = next
      continue
    }
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
        throw new UsageError(
          undefined,
          error instanceof Error ? error.message : String(error)
        )
      }
      options.tcp = raw
      continue
    }
    if (a === '--timeout' || a.startsWith('--timeout=')) {
      const { value, next } = takeValue(argv, i, '--timeout')
      options.timeout = value
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
