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
}

export const GLOBAL_FLAGS: GlobalFlag[] = [
  {
    spelling: '-t, --test',
    docName: '-t, --test',
    who: 'both',
    description: 'Use the six `-tester` servers'
  },
  {
    spelling: '    --fake',
    docName: '--fake',
    who: 'both',
    description: 'Emulate the login, info and sync servers in-process'
  },
  {
    spelling: '-d, --directory <path>',
    docName: '-d, --directory',
    who: 'both',
    description: 'Working directory for local Edge data'
  },
  {
    spelling: '-a, --app-id <id>',
    docName: '-a, --app-id',
    who: 'both',
    description: 'Application ID'
  },
  {
    spelling: '-k, --api-key <key>',
    docName: '-k, --api-key',
    who: 'both',
    description: 'Override API key from `keys.json`'
  },
  {
    spelling: '    --locale <tag>',
    docName: '--locale <tag>',
    who: 'both',
    description: 'Language tag (BCP 47 or POSIX)'
  },
  {
    spelling: '-c, --config <path>',
    docName: '-c, --config <path>',
    who: 'both',
    description: 'Configuration file'
  },
  {
    spelling: '-u, --username <user>',
    docName: '-u, --username',
    who: 'client',
    description: 'Legacy one-shot login helper'
  },
  {
    spelling: '-p, --password <pass>',
    docName: '-p, --password',
    who: 'client',
    description: 'Legacy one-shot login helper'
  },
  {
    spelling: '    --session <id>',
    docName: '--session <id>',
    who: 'client',
    description: 'Override the persisted `sessionId`'
  },
  {
    spelling: '    --no-spawn',
    docName: '--no-spawn',
    who: 'client',
    description: 'Do not auto-start the engine'
  },
  {
    spelling: '    --solve-captcha',
    docName: '--solve-captcha',
    who: 'client',
    description: 'On `CHALLENGE_REQUIRED`, auto-solve ALTCHA PoW and retry'
  },
  {
    spelling: '    --timeout=<seconds>',
    docName: '--timeout=<seconds>',
    who: 'client',
    description: 'Per-request deadline (default `120`)'
  },
  {
    spelling: '    --tcp=<port>',
    docName: '--tcp=<port>',
    who: 'both',
    description: 'Bind TCP on `127.0.0.1`, token-authenticated'
  },
  {
    spelling: '    --tcp-host=<host>',
    docName: '--tcp-host=<host>',
    who: 'engine',
    description: 'TCP bind host, loopback only (default `127.0.0.1`)'
  },
  {
    spelling: '    --idle-timeout=<seconds>',
    docName: '--idle-timeout=<seconds>',
    who: 'engine',
    description: 'Self-shutdown once nothing holds the engine open'
  },
  {
    spelling: '-h, --help',
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
