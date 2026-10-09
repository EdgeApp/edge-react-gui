/**
 * Every global flag, once.
 *
 * The client's `HELP_TEXT`, the engine's `printHelp` and the table in
 * `docs/EDGE_CLI.md` each described the same flags in their own words, and
 * they had drifted: `-h, --help` was "Display options", "Show help" and
 * "Show options"; `-d, --directory` was "Working directory", "Working
 * directory for core data" and "Working directory for local Edge data"; and
 * `-k, --api-key` said "Auth server API key" on the client against "Override
 * API key from `keys.json`" on the engine — where the engine's wording is
 * the accurate one, because `-k` is forwarded and that is what it does.
 *
 * Both help texts are rendered from this list, and `scripts/verifyApiDocs.ts`
 * checks the guide's table against it in both directions, so the third copy
 * cannot drift either.
 *
 * No imports, so either entry point can use it.
 */

/** Which half of the CLI accepts a flag. */
export type FlagAudience = 'client' | 'engine' | 'both'

export interface GlobalFlag {
  /** As a help line spells it, e.g. `-d, --directory <path>`. */
  spelling: string
  /** As `docs/EDGE_CLI.md`'s first column spells it. */
  docName: string
  who: FlagAudience
  /** One line. The guide may add prose after it, not instead of it. */
  description: string
  /** On argv, e.g. `--directory`. */
  long: string
  /** Its one-letter alias, where it has one. */
  short?: string
  /** Whether a value follows it. */
  takesValue: boolean
  /**
   * The `CliOptions` field the client parser fills.
   *
   * Absent means the client parser does not record it: `--locale` is read
   * off argv by `bootNodeLocale` before this parser runs, so a field here
   * would be written and never read.
   */
  clientField?: string
  /** The `EngineArgs` field the engine parser fills, on the same terms. */
  engineField?: string
  /**
   * Parsed by each side itself, not from this table.
   *
   * The three flags whose value is validated as it is read — a TCP port, a
   * bind host, an idle timeout — each with its own error text. The table
   * still owns their spelling, audience and description.
   */
  custom?: true
}

export const GLOBAL_FLAGS: GlobalFlag[] = [
  {
    spelling: '-t, --test',
    long: '--test',
    short: '-t',
    takesValue: false,
    clientField: 'test',
    engineField: 'testMode',
    docName: '-t, --test',
    who: 'both',
    description: 'Use the six `-tester` servers'
  },
  {
    spelling: '    --fake',
    long: '--fake',
    takesValue: false,
    clientField: 'fake',
    engineField: 'fake',
    docName: '--fake',
    who: 'both',
    description: 'Emulate the login, info and sync servers in-process'
  },
  {
    spelling: '-d, --directory <path>',
    long: '--directory',
    short: '-d',
    takesValue: true,
    clientField: 'directory',
    engineField: 'directory',
    docName: '-d, --directory',
    who: 'both',
    description: 'Working directory for local Edge data'
  },
  {
    spelling: '-a, --app-id <id>',
    long: '--app-id',
    short: '-a',
    takesValue: true,
    clientField: 'app-id',
    engineField: 'appId',
    docName: '-a, --app-id',
    who: 'both',
    description: 'Application ID'
  },
  {
    spelling: '-k, --api-key <key>',
    long: '--api-key',
    short: '-k',
    takesValue: true,
    clientField: 'api-key',
    engineField: 'apiKey',
    docName: '-k, --api-key',
    who: 'both',
    description: 'Override API key from `keys.json`'
  },
  {
    spelling: '    --locale <tag>',
    long: '--locale',
    takesValue: true,
    engineField: 'locale',
    docName: '--locale <tag>',
    who: 'both',
    description: 'Language tag (BCP 47 or POSIX)'
  },
  {
    spelling: '-c, --config <path>',
    long: '--config',
    short: '-c',
    takesValue: true,
    clientField: 'config',
    engineField: 'configPath',
    docName: '-c, --config <path>',
    who: 'both',
    description: 'Configuration file'
  },
  {
    spelling: '-u, --username <user>',
    long: '--username',
    short: '-u',
    takesValue: true,
    clientField: 'username',
    docName: '-u, --username',
    who: 'client',
    description: 'Legacy one-shot login helper'
  },
  {
    spelling: '-p, --password <pass>',
    long: '--password',
    short: '-p',
    takesValue: true,
    clientField: 'password',
    docName: '-p, --password',
    who: 'client',
    description: 'Legacy one-shot login helper'
  },
  {
    spelling: '    --session <id>',
    long: '--session',
    takesValue: true,
    clientField: 'session',
    docName: '--session <id>',
    who: 'client',
    description: 'Override the persisted `sessionId`'
  },
  {
    spelling: '    --no-spawn',
    long: '--no-spawn',
    takesValue: false,
    clientField: 'no-spawn',
    docName: '--no-spawn',
    who: 'client',
    description: 'Do not auto-start the engine'
  },
  {
    spelling: '    --solve-captcha',
    long: '--solve-captcha',
    takesValue: false,
    clientField: 'solve-captcha',
    docName: '--solve-captcha',
    who: 'client',
    description: 'On `CHALLENGE_REQUIRED`, auto-solve ALTCHA PoW and retry'
  },
  {
    spelling: '    --timeout=<seconds>',
    long: '--timeout',
    takesValue: true,
    clientField: 'timeout',
    docName: '--timeout=<seconds>',
    who: 'client',
    description: 'Per-request deadline (default `120`)'
  },
  {
    spelling: '    --tcp=<port>',
    long: '--tcp',
    takesValue: true,
    custom: true,
    docName: '--tcp=<port>',
    who: 'both',
    description: 'Bind TCP on `127.0.0.1`, token-authenticated'
  },
  {
    spelling: '    --tcp-host=<host>',
    long: '--tcp-host',
    takesValue: true,
    custom: true,
    docName: '--tcp-host=<host>',
    who: 'engine',
    description: 'TCP bind host, loopback only (default `127.0.0.1`)'
  },
  {
    spelling: '    --idle-timeout=<seconds>',
    long: '--idle-timeout',
    takesValue: true,
    custom: true,
    docName: '--idle-timeout=<seconds>',
    who: 'engine',
    description: 'Self-shutdown once nothing holds the engine open'
  },
  {
    spelling: '-h, --help',
    long: '--help',
    short: '-h',
    takesValue: false,
    clientField: 'help',
    engineField: 'help',
    docName: '-h, --help',
    who: 'both',
    description: 'Show options'
  }
]

/**
 * Render the flags one half accepts, as aligned help lines.
 *
 * The column is computed from the longest spelling rather than hand-spaced,
 * which is what left the long-only flags starting two columns left of the
 * short-flag rows in the engine's help.
 */
export function renderFlagHelp(who: 'client' | 'engine'): string {
  const rows = GLOBAL_FLAGS.filter(f => f.who === who || f.who === 'both')
  const width = Math.max(...rows.map(f => f.spelling.length)) + 2
  return rows
    .map(f => `  ${f.spelling.padEnd(width)}${f.description}`)
    .join('\n')
}

/**
 * The flag an argument names, by any spelling the table gives it.
 *
 * One copy, because both parsers had it: the client as `matchFlag` and the
 * engine written out inside `ENGINE_FLAGS.find`, byte for byte. It is the
 * rule that decides which spellings argv accepts, and the drift this class
 * already produced was real — `-k=value` worked on one side and not the
 * other, which no table entry or help line mentioned.
 */
export function matchFlag(
  flags: GlobalFlag[],
  arg: string
): GlobalFlag | undefined {
  return flags.find(
    flag =>
      arg === flag.long ||
      arg === flag.short ||
      (flag.takesValue &&
        (arg.startsWith(`${flag.long}=`) ||
          (flag.short != null && arg.startsWith(`${flag.short}=`))))
  )
}

/**
 * The value a flag takes, from either spelling.
 *
 * Three implementations of "the token after a flag, refused when it is
 * missing, empty or itself a flag" — `parseArgs.ts`'s `takeValue`,
 * `commandArgs.ts`'s `takeValue`, and the engine's `requireNonEmpty` plus
 * `flagValue` — with two of them carrying a comment saying they must agree
 * with the others.
 *
 * `''` is refused as well as absent, because the two are the same forgotten
 * value: `-d ""` reached the profile hash as an empty directory while the
 * engine used its default, which is two engines and a 30-second spawn
 * timeout with a healthy one running. A value beginning with `-` is refused
 * for the same reason: `--directory --tcp=9312` created a directory named
 * `--tcp=9312` and dropped the TCP flag.
 *
 * `reject` is the caller's error constructor, since the client, the
 * per-command parser and the engine each have their own, and `missing` is
 * its wording — the client says "Missing value for --flag" and the engine
 * "--flag requires a value", both of which their suites assert. `isCommand`
 * is the client's extra test: `edge-cli --directory balance-map` is a
 * forgotten value, not a directory called `balance-map`.
 */
export function takeFlagValue(
  argv: string[],
  i: number,
  flag: string,
  opts: {
    reject: (message: string) => never
    missing?: (flag: string) => string
    isCommand?: (value: string) => boolean
  }
): { value: string; next: number } {
  const { reject, isCommand } = opts
  const missing =
    opts.missing ?? ((name: string) => `Missing value for ${name}`)
  const current = argv[i]
  const eq = current.indexOf('=')
  if (eq !== -1) {
    const value = current.slice(eq + 1)
    if (value === '') reject(missing(flag))
    return { value, next: i }
  }
  const next = argv[i + 1]
  if (next == null || next === '' || next.startsWith('-')) {
    reject(missing(flag))
  }
  if (isCommand?.(next) === true) {
    reject(`${missing(flag)}: "${next}" is a command. Write ${flag}=<value>.`)
  }
  return { value: next, next: i + 1 }
}
