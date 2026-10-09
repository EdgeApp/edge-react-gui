import { describe, expect, it } from '@jest/globals'

import {
  type EngineArgs,
  EngineUsageError,
  parseEngineArgs
} from '../../cli/engine/engineArgs'
import { GLOBAL_FLAGS } from '../../cli/flagTable'

function usage(argv: string[]): string {
  try {
    parseEngineArgs(argv)
  } catch (error) {
    if (error instanceof EngineUsageError) return error.message
    throw error
  }
  throw new Error('expected an EngineUsageError')
}

/**
 * The engine's command line, which nothing could test before.
 *
 * It lived inside `index.ts`, which starts an engine as a side effect of
 * being imported. What it decides is the whole contract: the data directory,
 * the app id and the test-server flag all feed the profile hash a client
 * looks an engine up by, so a flag read wrongly here is a client waiting out
 * its spawn timeout against a healthy daemon.
 */
describe('parseEngineArgs', () => {
  it('reads each valued flag in both spellings', () => {
    const expected: Partial<EngineArgs> = {
      directory: '/tmp/edge',
      appId: 'app',
      apiKey: 'key',
      locale: 'fr-FR',
      configPath: '/tmp/edge.conf'
    }
    expect(
      parseEngineArgs([
        '--directory=/tmp/edge',
        '--app-id=app',
        '--api-key=key',
        '--locale=fr-FR',
        '--config=/tmp/edge.conf'
      ])
    ).toMatchObject(expected)
    expect(
      parseEngineArgs([
        '-d',
        '/tmp/edge',
        '-a',
        'app',
        '-k',
        'key',
        '--locale',
        'fr-FR',
        '-c',
        '/tmp/edge.conf'
      ])
    ).toMatchObject(expected)
  })

  it('does not read one flag’s value as another flag', () => {
    // The shape this replaces ran five value-taking probes at the top of
    // every iteration, each re-reading `argv[i]` after an earlier one had
    // advanced it. It was safe only because `flagValue` refuses a value
    // starting with `-`, an invariant stated in another function.
    const args = parseEngineArgs(['--config', '/tmp/a.conf', '--app-id=b'])
    expect(args.configPath).toBe('/tmp/a.conf')
    expect(args.appId).toBe('b')
    expect(args.directory).toBeUndefined()
  })

  it('reads the booleans and the defaults', () => {
    expect(parseEngineArgs([])).toMatchObject({
      testMode: false,
      fake: false,
      help: false,
      tcpPort: null,
      tcpHost: '127.0.0.1',
      idleTimeoutSeconds: 300
    })
    expect(parseEngineArgs(['-t', '--fake', '-h'])).toMatchObject({
      testMode: true,
      fake: true,
      help: true
    })
  })

  it('refuses a flag with no value, in either spelling', () => {
    expect(usage(['--directory'])).toContain('requires a value')
    expect(usage(['--directory='])).toContain('requires a value')
    expect(usage(['-d', ''])).toContain('requires a value')
    // A forgotten value that is itself a flag: `--directory --tcp=9312`
    // used to create a directory named `--tcp=9312` and drop the port.
    expect(usage(['--directory', '--tcp=9312'])).toContain('requires a value')
  })

  it('keeps each custom flag’s own validation and message', () => {
    expect(usage(['--tcp'])).toContain('requires a port')
    expect(parseEngineArgs(['--tcp=9312']).tcpPort).toBe(9312)
    // `0` is the documented ephemeral port, and everything `listen` would
    // reject is refused here with the flag named.
    expect(parseEngineArgs(['--tcp=0']).tcpPort).toBe(0)
    expect(usage(['--tcp=70000'])).toMatch(/0-65535/)
    expect(usage(['--tcp='])).toMatch(/Missing value/)
    expect(usage(['--tcp-host='])).toContain('requires a value')
    // Loopback only: an engine on a LAN address exposes `get-raw-private-key`
    // and `spend` to it.
    expect(usage(['--tcp-host=0.0.0.0'])).toMatch(/loopback/i)
    expect(parseEngineArgs(['--idle-timeout=0']).idleTimeoutSeconds).toBe(0)
    expect(parseEngineArgs(['--idle-timeout', '30']).idleTimeoutSeconds).toBe(
      30
    )
    expect(usage(['--idle-timeout='])).toContain('seconds')
    expect(usage(['--idle-timeout=-1'])).toContain('Invalid')
    // Above the 32-bit timer ceiling, `seconds * 1000` becomes 1 ms after
    // a `TimeoutOverflowWarning`, so "keep it up for a month" shut the
    // engine down the instant it went idle — the opposite of the ask, with
    // the warning the only notice, on a stderr that goes to a startup log
    // a clean stop deletes.
    expect(usage(['--idle-timeout=2592000'])).toContain('at most')
    expect(usage(['--idle-timeout=2592000'])).toContain('0 for never')
    // The ceiling itself is still accepted.
    expect(parseEngineArgs(['--idle-timeout=2147483']).idleTimeoutSeconds).toBe(
      2147483
    )
    // A forgotten value gets the same message it gets for any other flag:
    // the space form used to read `argv[++i]` itself, so this answered
    // "Invalid --idle-timeout: --tcp=9312".
    expect(usage(['--idle-timeout', '--tcp=9312'])).toContain(
      'requires a value'
    )
    expect(usage(['--idle-timeout'])).toContain('requires a value')
  })

  it('refuses an unknown argument', () => {
    expect(usage(['--nope'])).toContain('Unknown argument')
  })

  it('fills a field that exists, for every flag it is told to fill', () => {
    const keys = new Set(
      Object.keys(
        parseEngineArgs([
          '-t',
          '--fake',
          '-h',
          '--directory=/tmp/x',
          '--app-id=a',
          '--api-key=k',
          '--locale=en-US',
          '--config=/tmp/c'
        ])
      )
    )
    for (const flag of GLOBAL_FLAGS) {
      if (flag.who === 'client' || flag.custom === true) continue
      expect(flag.engineField).toBeDefined()
      expect(keys).toContain(flag.engineField!)
    }
  })
})
