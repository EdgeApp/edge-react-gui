// The generated command table, so `isCommandName` has a registry to read:
// the "value is a command" guard is the whole point of one of these cases.
import '../../cli/commands/all'

import { describe, expect, it } from '@jest/globals'

import { UsageError } from '../../cli/command'
import { parseCommandArgs } from '../../cli/commandArgs'
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

  it('stops parsing options at a bare --', () => {
    // The only way to pass a command argument that looks like an option.
    const { options, argv } = parseCliArgs([
      '--fake',
      'spend',
      '--',
      '--to=-weird'
    ])
    expect(options.fake).toBe(true)
    expect(argv).toStrictEqual(['spend', '--', '--to=-weird'])
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
    // `edge-cli --directory balance-map` is a forgotten value, not a
    // directory called `balance-map`: taking it silently swallowed the
    // command and dropped the caller into the prompt with exit 0.
    const message = usage(() => parseCliArgs(['--directory', 'balance-map']))
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
    expect(
      usage(() =>
        parseCommandArgs(cmd, ['one', 'two'], {
          positional: 'optional',
          flags: {}
        })
      )
    ).toBeTruthy()
  })

  it('refuses a positional where none is allowed', () => {
    expect(
      usage(() =>
        parseCommandArgs(cmd, ['stray'], { positional: 'none', flags: {} })
      )
    ).toBeTruthy()
  })

  it('refuses a bad boolean value', () => {
    expect(
      usage(() =>
        parseCommandArgs(cmd, ['--use-max=maybe'], {
          positional: 'none',
          flags: { 'use-max': 'boolean' }
        })
      )
    ).toBeTruthy()
  })
})
