// The generated command table, so `hasCommand` has a registry to read: it
// is what supplies `takeFlagValue`'s `isCommand` option, and the "value is
// a command" guard is the whole point of one of these cases.
import '../../cli/commands/all'

import { describe, expect, it } from '@jest/globals'

import { UsageError } from '../../cli/command'
import { parseCommandArgs } from '../../cli/commandArgs'
import { GLOBAL_FLAGS } from '../../cli/flagTable'
import { parseCliArgs } from '../../cli/parseArgs'

/**
 * The CLI's argv front door.
 *
 * Every corner these two files were hardened against was recorded as a
 * comment rather than a test, and the 130 offline invocations cover only the
 * shapes they happen to use.
 */
function usage(fn: () => unknown): string {
  try {
    fn()
  } catch (error) {
    if (error instanceof UsageError) return error.message
    throw error
  }
  throw new Error('expected a UsageError')
}

describe('parseCliArgs', () => {
  it('separates options from the command and its arguments', () => {
    const { options, argv } = parseCliArgs([
      '-t',
      '--directory=/tmp/x',
      'balance-map',
      '--wallet-id=abc'
    ])
    expect(options.test).toBe(true)
    expect(options.directory).toBe('/tmp/x')
    expect(argv).toStrictEqual(['balance-map', '--wallet-id=abc'])
  })

  it('takes a value in either spelling', () => {
    expect(parseCliArgs(['--directory=/tmp/a']).options.directory).toBe(
      '/tmp/a'
    )
    expect(parseCliArgs(['--directory', '/tmp/a']).options.directory).toBe(
      '/tmp/a'
    )
  })

  it('refuses an empty value, because the profile hash is built from it', () => {
    // An empty directory on this side and a default on the engine's side are
    // two different engines.
    expect(usage(() => parseCliArgs(['--directory=']))).toContain(
      'Missing value'
    )
    expect(usage(() => parseCliArgs(['--app-id=']))).toContain('Missing value')
    expect(usage(() => parseCliArgs(['--api-key=']))).toContain('Missing value')
  })

  it('refuses an empty value in the space form too', () => {
    // `-d ""` is the same forgotten value as `--directory=`, and it reached
    // the profile hash as an empty directory while the engine used its
    // default: two different engines, and a 30-second spawn timeout with a
    // healthy engine running.
    expect(usage(() => parseCliArgs(['-d', '']))).toContain('Missing value')
    expect(usage(() => parseCliArgs(['--directory', '']))).toContain(
      'Missing value'
    )
  })

  it('refuses a bare --tcp and an empty one, and takes a port', () => {
    // The docs document `--tcp=<port>`; a bare flag has no port, and
    // `--tcp=` used to mean "no listener" on one side and bad argv on the
    // other.
    expect(usage(() => parseCliArgs(['--tcp']))).toContain('requires a port')
    expect(usage(() => parseCliArgs(['--tcp=']))).toContain('Missing value')
    expect(parseCliArgs(['--tcp=9008']).options.tcp).toBe('9008')
    // 0 is documented as "pick an ephemeral port".
    expect(parseCliArgs(['--tcp=0']).options.tcp).toBe('0')
  })

  it('passes a command and its args through after the command name', () => {
    // Not the `--` arm: `spend` is the first non-option, so the loop leaves
    // at the command-name branch and everything after it — the literal `--`
    // included — is the command's. This case used to be titled for the `--`
    // arm, and its own expectation showed it never reached it.
    const { options, argv } = parseCliArgs([
      '--fake',
      'spend',
      '--',
      '--to=-weird'
    ])
    expect(options.fake).toBe(true)
    expect(argv).toStrictEqual(['spend', '--', '--to=-weird'])
  })

  it('stops parsing options at a bare -- before the command', () => {
    // The arm that strips `--` and keeps only what follows, which is the one
    // way to give a *command name* that starts with a dash, or to stop the
    // global parser refusing an unknown leading flag.
    const { options, argv } = parseCliArgs(['--fake', '--', '-weird-command'])
    expect(options.fake).toBe(true)
    expect(argv).toStrictEqual(['-weird-command'])
  })

  it('takes a bare -- with nothing after it as no command', () => {
    expect(parseCliArgs(['--']).argv).toStrictEqual([])
  })

  it('reads the config, directory and timeout flags in both spellings', () => {
    // Three arms that ran in no test at any level. `-c`/`-d` are the short
    // forms the guide publishes, and the `=` and space forms both have to
    // work — `takeValue` is shared, but which flag each arm records is not.
    expect(parseCliArgs(['--config=/tmp/a.conf']).options.config).toBe(
      '/tmp/a.conf'
    )
    expect(parseCliArgs(['-c', '/tmp/b.conf']).options.config).toBe(
      '/tmp/b.conf'
    )
    expect(parseCliArgs(['--directory=/tmp/d']).options.directory).toBe(
      '/tmp/d'
    )
    expect(parseCliArgs(['-d', '/tmp/e']).options.directory).toBe('/tmp/e')
    expect(parseCliArgs(['--timeout=45']).options.timeout).toBe('45')
    expect(parseCliArgs(['--timeout', '60']).options.timeout).toBe('60')
  })

  it('consumes --locale without recording it', () => {
    // Deliberate: `detectNodeLocale` reads argv itself from
    // `bootNodeLocale`, which runs before this parser, so a field here would
    // be written and never read. What this pins is that the *value* is
    // consumed — otherwise `es-MX` would fall through to the command-name
    // branch and become the command.
    const { options, argv } = parseCliArgs(['--locale', 'es-MX', 'help'])
    expect(argv).toStrictEqual(['help'])
    expect('locale' in options).toBe(false)
    expect(parseCliArgs(['--locale=fr', 'help']).argv).toStrictEqual(['help'])
  })

  it('refuses a missing value rather than eating the next flag', () => {
    expect(usage(() => parseCliArgs(['--directory']))).toContain(
      'Missing value'
    )
    expect(usage(() => parseCliArgs(['--directory', '-t']))).toContain(
      'Missing value'
    )
  })

  it('refuses a command name where a value belongs', () => {
    // `edge-cli --directory engine-status` is a forgotten value, not a
    // directory called `engine-status`: taking it silently swallowed the
    // command and dropped the caller into the prompt with exit 0.
    //
    // `engine-status` rather than a wallet command, so this case is true of
    // every commit that has the registry: the guard is about any registered
    // name, and a command that arrives later made the example fail on the
    // engine commit's own tree.
    const message = usage(() => parseCliArgs(['--directory', 'engine-status']))
    expect(message).toContain('is a command')
    expect(message).toContain('--directory=<value>')
  })

  it('reads the short forms', () => {
    const { options } = parseCliArgs(['-t', '-a', 'edge.app', '-k', 'key123'])
    expect(options.test).toBe(true)
    expect(options['app-id']).toBe('edge.app')
    expect(options['api-key']).toBe('key123')
  })

  it('reads the boolean switches', () => {
    const { options } = parseCliArgs([
      '--fake',
      '--no-spawn',
      '--solve-captcha',
      '--help'
    ])
    expect(options.fake).toBe(true)
    expect(options['no-spawn']).toBe(true)
    expect(options['solve-captcha']).toBe(true)
    expect(options.help).toBe(true)
  })

  it('refuses an unknown option', () => {
    expect(usage(() => parseCliArgs(['--nope']))).toContain('--nope')
  })

  it('stops reading options at the command name', () => {
    // Everything after the command belongs to the command, including flags
    // whose names the front door also knows.
    const { options, argv } = parseCliArgs([
      'subscribe',
      '--type=session.created'
    ])
    expect(options).toStrictEqual({})
    expect(argv).toStrictEqual(['subscribe', '--type=session.created'])
  })
})

describe('parseCommandArgs', () => {
  const cmd = { name: 'demo', invoke: async () => {} }

  it('reads a string flag in either spelling', () => {
    const args = parseCommandArgs(cmd, ['--to=addr'], {
      positional: 'none',
      flags: { to: 'string' }
    })
    expect(args.string('to')).toBe('addr')
    expect(
      parseCommandArgs(cmd, ['--to', 'addr'], {
        positional: 'none',
        flags: { to: 'string' }
      }).string('to')
    ).toBe('addr')
  })

  // Both spellings of the same mistake, answered the same way. `--to=` always
  // was a usage error; `--to ""` used to be accepted, spawn an engine and
  // come back as a 400 from the route.
  it('refuses an empty value in either spelling', () => {
    for (const argv of [['--to='], ['--to', '']]) {
      expect(() =>
        parseCommandArgs(cmd, argv, {
          positional: 'none',
          flags: { to: 'string' }
        })
      ).toThrow('--to requires a value')
    }
  })

  it('reads a bare boolean as true and an explicit value as given', () => {
    const flags = { 'use-max': 'boolean' } as const
    expect(
      parseCommandArgs(cmd, ['--use-max'], {
        positional: 'none',
        flags
      }).boolean('use-max')
    ).toBe(true)
    expect(
      parseCommandArgs(cmd, ['--use-max=false'], {
        positional: 'none',
        flags
      }).boolean('use-max')
    ).toBe(false)
  })

  it('reports an absent boolean as false, and says it was not given', () => {
    const args = parseCommandArgs(cmd, [], {
      positional: 'none',
      flags: { 'use-max': 'boolean' }
    })
    expect(args.boolean('use-max')).toBe(false)
    expect(args.booleanGiven('use-max')).toBe(false)
  })

  it('collects a repeat flag in order', () => {
    const args = parseCommandArgs(cmd, ['--type=a', '--type=b', '--type=a'], {
      positional: 'none',
      flags: { type: 'repeat' }
    })
    expect(args.strings('type')).toStrictEqual(['a', 'b', 'a'])
  })

  it('refuses an unknown flag, and a second positional', () => {
    expect(
      usage(() =>
        parseCommandArgs(cmd, ['--nope=1'], {
          positional: 'none',
          flags: {}
        })
      )
    ).toContain('--nope')
    // `toContain`, not `toBeTruthy`: every refusal in this parser produces a
    // `UsageError`, so a truthy message is satisfied by the *wrong* one —
    // `--nope` rejected as a stray positional would have passed the case
    // above, and `--use-max=maybe` rejected as an unknown flag would pass
    // the one below. The bare argument error carries `UsageError`'s default
    // text, which is what identifies that arm.
    expect(
      usage(() =>
        parseCommandArgs(cmd, ['one', 'two'], {
          positional: 'optional',
          flags: {}
        })
      )
    ).toContain('Incorrect arguments')
  })

  it('refuses a positional where none is allowed', () => {
    expect(
      usage(() =>
        parseCommandArgs(cmd, ['stray'], { positional: 'none', flags: {} })
      )
    ).toContain('Incorrect arguments')
  })

  it('refuses a bad boolean value', () => {
    expect(
      usage(() =>
        parseCommandArgs(cmd, ['--use-max=maybe'], {
          positional: 'none',
          flags: { 'use-max': 'boolean' }
        })
      )
    ).toContain('--use-max must be true or false')
  })
})

/**
 * One declaration of the global flags, and two parsers that obey it.
 *
 * `flagTable.ts` renders both help texts and is checked against
 * `docs/EDGE_CLI.md` in both directions — and the two parsers used to
 * restate it by hand, which no gate could see. These cases are that gate:
 * the atoms each parser reads must agree with the spelling the help line
 * prints, and every field a parser is told to fill must exist on the object
 * it fills.
 */
describe('the global flag table', () => {
  it('spells each flag the same way in its help line and on argv', () => {
    for (const flag of GLOBAL_FLAGS) {
      const { spelling, docName, long, short, takesValue } = flag
      const trimmed = spelling.trim()
      // A value is spelled `--flag <value>` or `--flag=<value>`.
      const value = /[ =]<[^>]+>$/.exec(trimmed)
      expect(value != null).toBe(takesValue)
      // `-d, --directory <path>` → `-d` and `--directory`.
      const names = (
        value == null ? trimmed : trimmed.slice(0, value.index)
      ).split(', ')
      expect(names[names.length - 1]).toBe(long)
      if (short != null) expect(names[0]).toBe(short)
      else expect(names).toHaveLength(1)
      // And the guide's first column names the same flag.
      expect(docName).toContain(long)
    }
  })

  it('names a field on the side that records it', () => {
    const clientKeys = Object.keys(parseCliArgs(['--test', '--fake']).options)
    expect(clientKeys).toContain('test')
    for (const flag of GLOBAL_FLAGS) {
      if (flag.who === 'engine' || flag.custom === true) continue
      // Every client flag records something, except the ones read off argv
      // before this parser runs.
      if (!flag.takesValue) expect(flag.clientField).toBeDefined()
    }
  })

  it('accepts both spellings of a short alias', () => {
    // The drift the table-driven parser removes: `--api-key=x` worked and
    // `-k=x` was an unknown option, which no help line or guide row said.
    expect(parseCliArgs(['-k=abc']).options['api-key']).toBe('abc')
    expect(parseCliArgs(['--api-key=abc']).options['api-key']).toBe('abc')
    expect(parseCliArgs(['-k', 'abc']).options['api-key']).toBe('abc')
  })

  it('still refuses an unknown flag and an empty value', () => {
    expect(usage(() => parseCliArgs(['--nope']))).toContain('Unknown option')
    expect(usage(() => parseCliArgs(['-k=']))).toContain('Missing value')
    expect(usage(() => parseCliArgs(['--directory=']))).toContain(
      'Missing value'
    )
  })
})

/**
 * A flag name is argv, so a lookup on it needs an own-property guard.
 *
 * `spec.flags` is a plain object literal, so for the eight
 * `Object.prototype` members the kind lookup found an inherited function —
 * not null, so the "unknown option" test never fired, and the flag was
 * accepted and stored under a key nothing reads. `--constructor=x` was taken
 * where `--anything-else=x` is a usage error at exit 2.
 */
describe('a prototype member as a flag name', () => {
  const cmd = { name: 'probe', usage: 'probe' } as unknown as Parameters<
    typeof parseCommandArgs
  >[0]

  it('is an unknown option, like any other', () => {
    for (const name of ['constructor', 'toString', '__proto__', 'valueOf']) {
      expect(
        usage(() =>
          parseCommandArgs(cmd, [`--${name}=x`], {
            flags: { real: 'string' }
          })
        )
      ).toContain('Unknown option')
    }
  })

  it('still takes a flag the spec declares', () => {
    const args = parseCommandArgs(cmd, ['--real=x'], {
      flags: { real: 'string' }
    })
    expect(args.string('real')).toBe('x')
  })
})
