import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest
} from '@jest/globals'
import { EventEmitter } from 'events'
import fs from 'fs'
import os from 'os'
import path from 'path'

import type * as SpawnEngineModule from '../../cli/client/spawnEngine'
import { ENGINE_EXIT_ALREADY_RUNNING } from '../../cli/engine/discovery'

/**
 * The three decisions `ensureEngine` makes, which nothing reached.
 *
 * `spawnEngine.ts` was 4.3% of statements and 0% of branches, so both fixes
 * this branch put into it landed with no test: the append-plus-trim of
 * `engine-startup.log`, and the `ENGINE_EXIT_ALREADY_RUNNING` arm that tells
 * "someone else owns the profile, keep waiting" from "this engine failed to
 * start". The second is a race whose whole content is an exit-code
 * comparison across two halves of the CLI, so a drift in that constant, or a
 * `signal == null` that stopped holding, silently restored the old failure —
 * exit 7 and "Stop it first" about an engine the client had started itself.
 *
 * `os.homedir` is stubbed because `discovery` resolves it at call time, and
 * `HOME` is not enough under jest.
 */
let home: string
let homedir: jest.SpiedFunction<typeof os.homedir>

function load(): typeof SpawnEngineModule {
  return require('../../cli/client/spawnEngine')
}

beforeEach(() => {
  jest.useRealTimers()
  home = fs.mkdtempSync(path.join(os.tmpdir(), 'edge-ensure-'))
  homedir = jest.spyOn(os, 'homedir').mockReturnValue(home)
  jest.resetModules()
})

afterEach(() => {
  homedir.mockRestore()
  fs.rmSync(home, { recursive: true, force: true })
  jest.useFakeTimers()
})

/** A detached child that never really ran, with the API the code uses. */
function fakeChild(): any {
  const child: any = new EventEmitter()
  child.unref = () => {}
  return child
}

const KEY = {
  appId: 'edge.app',
  directory: path.join('/tmp', 'ensure-data'),
  testMode: false
}

describe('classifyEngineExit', () => {
  it('reads the already-running exit as someone else owning the profile', () => {
    const { classifyEngineExit } = load()
    expect(classifyEngineExit(ENGINE_EXIT_ALREADY_RUNNING, null)).toStrictEqual(
      { kind: 'owned' }
    )
  })

  it('reads every other exit as a startup failure', () => {
    const { classifyEngineExit } = load()
    expect(classifyEngineExit(1, null)).toStrictEqual({
      kind: 'died',
      info: 'exited with code 1'
    })
    expect(classifyEngineExit(0, null)).toStrictEqual({
      kind: 'died',
      info: 'exited with code 0'
    })
    expect(classifyEngineExit(null, null)).toStrictEqual({
      kind: 'died',
      info: 'exited with code 0'
    })
  })

  it('reads a signal as a failure even on the already-running code', () => {
    // `signal == null` is half the test: a child killed by a signal reports
    // `code === null`, and a crash that happened to report the same number
    // must not be mistaken for an orderly "someone else owns it".
    const { classifyEngineExit } = load()
    expect(
      classifyEngineExit(ENGINE_EXIT_ALREADY_RUNNING, 'SIGKILL')
    ).toStrictEqual({ kind: 'died', info: 'killed by SIGKILL' })
  })
})

describe('shouldTrimStartupLog', () => {
  it('trims only above the cap', () => {
    const { shouldTrimStartupLog } = load()
    expect(shouldTrimStartupLog(0)).toBe(false)
    expect(shouldTrimStartupLog(256 * 1024)).toBe(false)
    expect(shouldTrimStartupLog(256 * 1024 + 1)).toBe(true)
  })
})

describe('ensureEngine', () => {
  it('returns at once when an engine is already listening', async () => {
    const { ensureEngine } = load()
    let spawned = 0
    await ensureEngine({
      ...KEY,
      deps: {
        ping: async () => true,
        spawn: ((..._args: unknown[]) => {
          ++spawned
          return fakeChild()
        }) as any
      }
    })
    expect(spawned).toBe(0)
  })

  it('keeps polling when the child exits because another engine owns it', async () => {
    // The fix for 1.harness-review.14. The child exits immediately with
    // `ENGINE_EXIT_ALREADY_RUNNING`, and the engine that *did* win the claim
    // binds its socket a moment later — so this has to wait rather than
    // report a startup failure.
    const { ensureEngine } = load()
    let pings = 0
    const child = fakeChild()
    await ensureEngine({
      ...KEY,
      deps: {
        pollMs: 5,
        spawnTimeoutMs: 2000,
        ping: async () => {
          // Not listening for the first few polls, then the winner is up.
          return ++pings > 3
        },
        spawn: (() => {
          setTimeout(() => {
            child.emit('exit', ENGINE_EXIT_ALREADY_RUNNING, null)
          }, 1)
          return child
        }) as any
      }
    })
    expect(pings).toBeGreaterThan(3)
  })

  it('reports a startup failure for any other exit code', async () => {
    const { ensureEngine, EngineUnavailableError } = load()
    const child = fakeChild()
    const promise = ensureEngine({
      ...KEY,
      deps: {
        pollMs: 5,
        spawnTimeoutMs: 2000,
        ping: async () => false,
        spawn: (() => {
          setTimeout(() => {
            child.emit('exit', 1, null)
          }, 1)
          return child
        }) as any
      }
    })
    await expect(promise).rejects.toThrow(EngineUnavailableError)
    await expect(promise).rejects.toThrow(/exited with code 1 during startup/)
  })

  it('says another engine owns it when the deadline passes', async () => {
    // The other half of the same arm: the owner never bound its socket, so
    // the timeout message has to say which of the two happened.
    const { ensureEngine } = load()
    const child = fakeChild()
    await expect(
      ensureEngine({
        ...KEY,
        deps: {
          pollMs: 5,
          spawnTimeoutMs: 60,
          ping: async () => false,
          spawn: (() => {
            setTimeout(() => {
              child.emit('exit', ENGINE_EXIT_ALREADY_RUNNING, null)
            }, 1)
            return child
          }) as any
        }
      })
    ).rejects.toThrow(/another engine owns the profile/)
  })

  it('reports a spawn error rather than dying with a raw stack', async () => {
    const { ensureEngine } = load()
    const child = fakeChild()
    await expect(
      ensureEngine({
        ...KEY,
        deps: {
          pollMs: 5,
          spawnTimeoutMs: 2000,
          ping: async () => false,
          spawn: (() => {
            setTimeout(() => {
              child.emit('error', new Error('EAGAIN'))
            }, 1)
            return child
          }) as any
        }
      })
    ).rejects.toThrow(/Could not start the engine: EAGAIN/)
  })

  it('appends to the startup log and trims it past the cap', async () => {
    // `'w'` wiped the log of an engine that was still booting, and both
    // children then wrote to one inode at independent offsets — so the
    // surviving engine's startup record was the one record a racing start
    // could not be diagnosed from. Appended, and trimmed only when it has
    // grown past the cap.
    const { ensureEngine } = load()
    const { profileHash, runDir } = require('../../cli/engine/discovery')
    const profile = profileHash({ ...KEY, loginServer: undefined })
    const startupLog = path.join(runDir(profile), 'engine-startup.log')

    const spawnOnce = async (): Promise<void> => {
      const child = fakeChild()
      await ensureEngine({
        ...KEY,
        deps: {
          pollMs: 5,
          spawnTimeoutMs: 40,
          ping: async () => false,
          spawn: (() => child) as any
        }
      }).catch(() => {})
    }

    fs.mkdirSync(runDir(profile), { recursive: true })
    fs.writeFileSync(startupLog, 'earlier boot\n')
    await spawnOnce()
    // Still there: the previous attempt's record survives the next spawn.
    expect(fs.readFileSync(startupLog, 'utf8')).toContain('earlier boot')

    fs.writeFileSync(startupLog, 'x'.repeat(256 * 1024 + 10))
    await spawnOnce()
    expect(fs.statSync(startupLog).size).toBe(0)
  })
})

/**
 * The wiring the 2.harness-review.3 fix is actually about.
 *
 * `engineEnv.test.ts` proves the helper strips the secrets; this proves the
 * child gets the stripped copy. Put back `...process.env` at the call site
 * and every other suite still passes, while an `EDGE_CLI_PASSWORD` or a
 * session token lives in a detached daemon's environment for its whole life.
 */
describe('the spawned engine’s environment', () => {
  const saved: Record<string, string | undefined> = {}
  const SET = {
    EDGE_CLI_PASSWORD: 'hunter2',
    EDGE_CLI_PIN: '1234',
    EDGE_CLI_SESSION: 'bearer-session'
  }
  beforeEach(() => {
    for (const [name, value] of Object.entries(SET)) {
      saved[name] = process.env[name]
      process.env[name] = value
    }
  })
  afterEach(() => {
    for (const name of Object.keys(SET)) {
      if (saved[name] == null) Reflect.deleteProperty(process.env, name)
      else process.env[name] = saved[name]
    }
  })

  it('withholds every credential and keeps what the engine needs', async () => {
    const { ensureEngine } = load()
    let env: NodeJS.ProcessEnv | undefined
    let pings = 0
    await ensureEngine({
      ...KEY,
      apiKey: 'the-api-key',
      deps: {
        pollMs: 5,
        spawnTimeoutMs: 2000,
        ping: async () => ++pings > 1,
        spawn: ((_cmd: string, _args: string[], options: any) => {
          env = options.env
          return fakeChild()
        }) as any
      }
    })
    if (env == null) throw new Error('the engine was never spawned')
    expect(env.EDGE_CLI_PASSWORD).toBeUndefined()
    expect(env.EDGE_CLI_PIN).toBeUndefined()
    expect(env.EDGE_CLI_SESSION).toBeUndefined()
    expect(env.EDGE_CLI_LOCALE).toBeDefined()
    expect(env.EDGE_CLI_API_KEY).toBe('the-api-key')
  })
})

/**
 * Where the engine is looked for.
 *
 * Two candidates used to resolve against the working directory, so on a
 * partial install `edge-cli` run inside any checkout spawned that
 * directory's script as the daemon, handing it `EDGE_CLI_API_KEY` and every
 * password typed afterwards. Under jest `__dirname` always finds the source
 * entry first, so only the list itself can show a cwd candidate came back.
 */
describe('the engine entry', () => {
  it('is looked for beside this module and nowhere else', () => {
    const { engineEntryCandidates } = load()
    const dir = path.join(home, 'lib')
    const before = engineEntryCandidates(dir)
    const elsewhere = fs.mkdtempSync(path.join(os.tmpdir(), 'edge-cwd-'))
    const cwd = process.cwd()
    try {
      fs.mkdirSync(path.join(elsewhere, 'lib'), { recursive: true })
      fs.writeFileSync(path.join(elsewhere, 'lib/edgeEngine.js'), '')
      process.chdir(elsewhere)
      expect(engineEntryCandidates(dir)).toStrictEqual(before)
    } finally {
      process.chdir(cwd)
      fs.rmSync(elsewhere, { recursive: true, force: true })
    }
    for (const candidate of before) {
      expect(candidate.startsWith(home)).toBe(true)
    }
  })

  it('is a clean ENGINE_UNAVAILABLE when no candidate exists', async () => {
    const { ensureEngine, EngineUnavailableError } = load()
    await expect(
      ensureEngine({
        ...KEY,
        deps: {
          ping: async () => false,
          entryDir: path.join(home, 'nowhere', 'lib')
        }
      })
    ).rejects.toBeInstanceOf(EngineUnavailableError)
  })
})
