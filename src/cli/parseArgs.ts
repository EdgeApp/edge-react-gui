/**
 * Minimal argv parser replacing node-getopt (which emits DEP0128 because its
 * package.json has `"main": "./lib"` instead of a file path).
 */

export interface CliOptions {
  'api-key'?: string
  'app-id'?: string
  config?: string
  directory?: string
  locale?: string
  username?: string
  password?: string
  test?: boolean
  session?: string
  'no-spawn'?: boolean
  'solve-captcha'?: boolean
  tcp?: string
  help?: boolean
}

export interface ParsedArgs {
  options: CliOptions
  argv: string[]
}

const HELP_TEXT = `Usage: edge-cli [options] [command] [args...]

Options:
  -k, --api-key <key>     Auth server API key
  -a, --app-id <id>       Application ID
  -c, --config <path>     Configuration file
  -d, --directory <path>  Working directory
  -u, --username <user>   Username (legacy one-shot login helper)
  -p, --password <pass>   Password (legacy one-shot login helper)
  -t, --test              Use tester servers
      --session <id>      Override sessionId
      --locale <tag>      Language tag (BCP 47 or POSIX)
      --no-spawn          Do not auto-start the engine
      --solve-captcha     Auto-solve CAPTCHA challenges (ALTCHA PoW)
      --tcp=<port>        Also pass --tcp=<port> when spawning the engine
  -h, --help              Display options
`

function takeValue(
  argv: string[],
  i: number,
  flag: string
): { value: string; next: number } {
  const cur = argv[i]
  const eq = cur.indexOf('=')
  if (eq !== -1) {
    return { value: cur.slice(eq + 1), next: i }
  }
  const next = argv[i + 1]
  if (next == null || next.startsWith('-')) {
    throw new Error(`Missing value for ${flag}`)
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
      const { value, next } = takeValue(argv, i, '--locale')
      options.locale = value
      i = next
      continue
    }
    if (a === '--tcp' || a.startsWith('--tcp=')) {
      if (a === '--tcp') {
        throw new Error('--tcp requires a port, e.g. --tcp=9008')
      }
      options.tcp = a.slice('--tcp='.length)
      continue
    }

    if (a.startsWith('-')) {
      if (positional.length === 0) {
        throw new Error(`Unknown option: ${a}`)
      }
      // Command-local flags (e.g. --dry-run) after the command name.
      positional.push(a)
      continue
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
