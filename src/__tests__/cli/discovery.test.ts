import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest
} from '@jest/globals'
import fs from 'fs'
import net from 'net'
import os from 'os'
import path from 'path'

import type * as DiscoveryModule from '../../cli/engine/discovery'

/**
 * `discovery` resolves the home directory at call time, so stubbing
 * `os.homedir` is enough to keep every case off the developer's real
 * `~/.edge-cli`. Setting `HOME` is *not* enough: under jest `os.homedir()`
 * does not read it, and a sweep would then delete the real run directory.
 */
let home: string
let homedir: jest.SpiedFunction<typeof os.homedir>

type Discovery = typeof DiscoveryModule
function load(): Discovery {
  return require('../../cli/engine/discovery')
}

beforeEach(() => {
  home = fs.mkdtempSync(path.join(os.tmpdir(), 'edge-discovery-'))
  homedir = jest.spyOn(os, 'homedir').mockReturnValue(home)
  jest.resetModules()
})

afterEach(() => {
  homedir.mockRestore()
  fs.rmSync(home, { recursive: true, force: true })
})

const key = {
  directory: '/tmp/data',
  appId: 'edge.app',
  testMode: false,
  loginServer: undefined
}

describe('profileHash', () => {
  it('is stable for the same key', () => {
    const { profileHash } = load()
    expect(profileHash(key)).toBe(profileHash({ ...key }))
  })

  it('differs for every field that picks a different engine', () => {
    const { profileHash } = load()
    const base = profileHash(key)
    expect(profileHash({ ...key, directory: '/tmp/other' })).not.toBe(base)
    expect(profileHash({ ...key, appId: 'other.app' })).not.toBe(base)
    expect(profileHash({ ...key, testMode: true })).not.toBe(base)
    expect(
      profileHash({ ...key, loginServer: 'https://login.example' })
    ).not.toBe(base)
  })

  it('is one profile per directory, however the path is spelled', () => {
    const { profileHash } = load()
    // The hash is the only thing keeping two engines off one core data
    // directory. Taken over the raw argv string, a trailing slash or a
    // relative path gave one directory several profiles, each holding what it
    // believed was an exclusive claim — the same two-EdgeContexts state the
    // claim ordering exists to prevent, reached with no race at all.
    const real = fs.realpathSync.native(
      fs.mkdtempSync(path.join(os.tmpdir(), 'edge-dir-'))
    )
    const link = path.join(home, 'link-to-data')
    fs.symlinkSync(real, link)
    const spellings = [
      real,
      `${real}/`,
      `${real}/.`,
      path.join(real, 'x', '..'),
      link
    ]
    const hashes = spellings.map(directory =>
      profileHash({ ...key, directory })
    )
    expect(new Set(hashes).size).toBe(1)

    // A path that does not exist yet still resolves, because the engine is
    // what creates the directory.
    const missing = path.join(real, 'not-yet')
    expect(profileHash({ ...key, directory: `${missing}/` })).toBe(
      profileHash({ ...key, directory: missing })
    )
    fs.rmSync(real, { recursive: true, force: true })
  })

  it('still separates genuinely different directories', () => {
    const { profileHash } = load()
    expect(profileHash({ ...key, directory: '/tmp/a' })).not.toBe(
      profileHash({ ...key, directory: '/tmp/b' })
    )
  })
})

describe('claimRunFile', () => {
  it('refuses a second claim on the same profile', () => {
    const { claimRunFile, ensureRunDir } = load()
    ensureRunDir('p1')
    const run = {
      pid: process.pid,
      apiVersion: '1',
      socketPath: path.join(home, 'engine.sock'),
      tcpPort: null,
      appId: 'edge.app',
      testMode: false,
      startedAt: new Date().toISOString()
    }
    expect(claimRunFile('p1', run as any)).toBe(true)
    // `flag: 'wx'` is the lock: two engines racing for one profile must not
    // both believe they own it.
    expect(claimRunFile('p1', run as any)).toBe(false)
  })
})

describe('removeRunArtifacts with a claim', () => {
  const run = (pid: number, startedAt: string): any => ({
    pid,
    apiVersion: '1',
    socketPath: path.join(home, 'engine.sock'),
    tcpPort: null,
    appId: 'edge.app',
    testMode: false,
    startedAt
  })

  it('leaves a replacement engine’s files alone', () => {
    // The old engine's listeners were still draining when a client started
    // a replacement, which took the profile over. The old engine's cleanup
    // used to delete the replacement's run file, leaving it unreachable.
    const { claimRunFile, ensureRunDir, readRunFile, removeRunArtifacts } =
      load()
    ensureRunDir('p2')
    const replacement = run(process.pid + 1, '2026-10-10T00:00:01.000Z')
    expect(claimRunFile('p2', replacement)).toBe(true)
    removeRunArtifacts('p2', {
      claim: { pid: process.pid, startedAt: '2026-10-10T00:00:00.000Z' }
    })
    expect(readRunFile('p2')?.pid).toBe(process.pid + 1)
  })

  it('removes its own', () => {
    const { claimRunFile, ensureRunDir, readRunFile, removeRunArtifacts } =
      load()
    ensureRunDir('p3')
    const mine = run(process.pid, '2026-10-10T00:00:00.000Z')
    expect(claimRunFile('p3', mine)).toBe(true)
    removeRunArtifacts('p3', {
      claim: { pid: process.pid, startedAt: mine.startedAt }
    })
    expect(readRunFile('p3')).toBeNull()
  })
})

describe('cleanupStaleLock', () => {
  /**
   * `startedAt` is a parameter because it is what separates the two cases
   * that otherwise look identical — a live pid with nothing listening. A
   * booting engine's claim is seconds old; a recycled pid's claim is however
   * long ago that engine was killed. Only the age tells them apart.
   */
  function seed(
    profile: string,
    pid: number,
    opts: { startedAt?: string | null } = {}
  ): void {
    const {
      ensureRunDir,
      runFilePath,
      sessionFilePath,
      socketPathFor,
      runDir
    } = load()
    const startedAt =
      opts.startedAt === undefined ? new Date().toISOString() : opts.startedAt
    ensureRunDir(profile)
    fs.writeFileSync(
      runFilePath(profile),
      JSON.stringify({
        pid,
        apiVersion: '1',
        socketPath: socketPathFor(profile),
        tcpPort: null,
        appId: 'edge.app',
        testMode: false,
        ...(startedAt == null ? {} : { startedAt })
      })
    )
    fs.writeFileSync(sessionFilePath(profile), '{"sessionId":"sess_x"}')
    fs.writeFileSync(socketPathFor(profile), '')
    fs.writeFileSync(path.join(runDir(profile), 'engine-startup.log'), 'boot')
  }

  /** A real listener on this profile's socket, closed by the caller. */
  async function listen(profile: string): Promise<net.Server> {
    const { socketPathFor } = load()
    const socketPath = socketPathFor(profile)
    try {
      fs.unlinkSync(socketPath)
    } catch {
      // not there
    }
    const server = net.createServer(socket => socket.end())
    await new Promise<void>(resolve => server.listen(socketPath, resolve))
    return server
  }

  it('returns the pid and removes nothing while the engine is alive', async () => {
    const { cleanupStaleLock, runFilePath, sessionFilePath } = load()
    seed('live', process.pid)
    const server = await listen('live')
    try {
      expect(await cleanupStaleLock('live')).toBe(process.pid)
      expect(fs.existsSync(runFilePath('live'))).toBe(true)
      expect(fs.existsSync(sessionFilePath('live'))).toBe(true)
    } finally {
      server.close()
    }
  })

  it('clears a claim whose pid is live but whose socket is not', async () => {
    const { cleanupStaleLock, runFilePath } = load()
    // The recycled-pid case: a SIGKILLed engine's run file names a pid the
    // OS later handed to something else, so `process.kill(pid, 0)` succeeds
    // for ever. On the pid alone the engine printed "already running" and
    // exited 1 on every invocation, and the sweep skipped the directory for
    // the same reason, so the profile stayed wedged until someone deleted it
    // by hand. `process.pid` is certainly alive, and nothing is listening.
    // Backdated past the boot grace, because that is what a recycled pid
    // always is: the engine that wrote this file died long enough ago for the
    // OS to hand its pid out again.
    seed('ghost', process.pid, {
      startedAt: new Date(Date.now() - 600_000).toISOString()
    })
    expect(await cleanupStaleLock('ghost')).toBeNull()
    expect(fs.existsSync(runFilePath('ghost'))).toBe(false)
  })

  it('honours a fresh claim with nothing listening yet', async () => {
    const { cleanupStaleLock, runFilePath, sessionFilePath, socketPathFor } =
      load()
    // The boot window. `claimRunFile` runs before `makeCoreContext`, which
    // opens the repos and starts every plugin, so for seconds a live engine
    // holds the claim with nothing bound. Treating that as stale let a second
    // cold invocation delete this engine's artifacts and claim the same
    // profile, so two EdgeContexts opened one core directory — and when the
    // two converged, the loser's cleanup unlinked the winner's live socket.
    seed('booting', process.pid)
    fs.unlinkSync(socketPathFor('booting'))
    expect(await cleanupStaleLock('booting')).toBe(process.pid)
    expect(fs.existsSync(runFilePath('booting'))).toBe(true)
    expect(fs.existsSync(sessionFilePath('booting'))).toBe(true)
  })

  it('falls back to the run file mtime when the claim has no startedAt', async () => {
    const { cleanupStaleLock, runFilePath } = load()
    // An engine from before `startedAt` existed is still booting-or-not, and
    // guessing "stale" would sweep it mid-boot. A fresh file is young.
    seed('legacy', process.pid, { startedAt: null })
    expect(await cleanupStaleLock('legacy')).toBe(process.pid)
    expect(fs.existsSync(runFilePath('legacy'))).toBe(true)

    // The same file, backdated past the grace, is stale again.
    seed('old-legacy', process.pid, { startedAt: null })
    const past = Date.now() - 600_000
    fs.utimesSync(runFilePath('old-legacy'), past / 1000, past / 1000)
    expect(await cleanupStaleLock('old-legacy')).toBeNull()
    expect(fs.existsSync(runFilePath('old-legacy'))).toBe(false)
  })

  it('leaves a live claim alone when the probe could not answer', async () => {
    const { cleanupStaleLock, runFilePath, sessionFilePath } = load()
    // The probe failing is not the target being dead. A single transient
    // failure in *this* process — EMFILE or ENFILE under fork pressure — or
    // a full accept backlog on an engine that is merely busy read as death,
    // and line 400 then unlinked a healthy engine's live `engine.sock` and
    // `engine.json`. That engine keeps serving on an unlinked inode:
    // `engine-stop`, `engine-status` and the TCP token are all unreachable,
    // it still holds a logged-in account, and the next engine binds a fresh
    // socket at the same path — two `EdgeContext`s on one data directory.
    //
    // Backdated well past the boot grace, so nothing but the probe's verdict
    // can be keeping this claim alive.
    seed('busy', process.pid, {
      startedAt: new Date(Date.now() - 600_000).toISOString()
    })
    let probes = 0
    expect(
      await cleanupStaleLock('busy', {
        probeSocket: async () => {
          ++probes
          return 'unknown'
        }
      })
    ).toBe(process.pid)
    // Twice, because the first failure may have been ours.
    expect(probes).toBe(2)
    expect(fs.existsSync(runFilePath('busy'))).toBe(true)
    expect(fs.existsSync(sessionFilePath('busy'))).toBe(true)
  })

  it('clears the claim when a retried probe gets a real answer', async () => {
    const { cleanupStaleLock, runFilePath } = load()
    seed('flaky', process.pid, {
      startedAt: new Date(Date.now() - 600_000).toISOString()
    })
    const answers: Array<'unknown' | 'absent'> = ['unknown', 'absent']
    expect(
      await cleanupStaleLock('flaky', {
        probeSocket: async () => answers.shift() ?? 'absent'
      })
    ).toBeNull()
    expect(fs.existsSync(runFilePath('flaky'))).toBe(false)
  })

  it('does not unlink a claim written while it was probing', async () => {
    const { cleanupStaleLock, runFilePath, sessionFilePath } = load()
    // The probe is an await, and `claimRunFile` is `wx`: a second engine can
    // take the profile inside that window. The verdict was formed from a run
    // file that is no longer there, so unlinking acts on an engine the
    // decision was never about — and that engine's own `main().catch` then
    // runs `removeRunArtifacts` for a profile a third process owns.
    seed('taken', process.pid, {
      startedAt: new Date(Date.now() - 600_000).toISOString()
    })
    const newClaim = {
      pid: process.pid,
      apiVersion: '1',
      socketPath: load().socketPathFor('taken'),
      tcpPort: null,
      appId: 'edge.app',
      testMode: false,
      startedAt: new Date().toISOString()
    }
    const result = await cleanupStaleLock('taken', {
      probeSocket: async () => {
        // A different engine claims the profile mid-probe.
        fs.writeFileSync(runFilePath('taken'), JSON.stringify(newClaim))
        return 'absent'
      }
    })
    // Null, so the caller goes on to `claimRunFile`, which fails EEXIST
    // against the new owner's file and exits "already running" — a refusal,
    // where unlinking was two owners.
    expect(result).toBeNull()
    expect(fs.existsSync(runFilePath('taken'))).toBe(true)
    expect(fs.existsSync(sessionFilePath('taken'))).toBe(true)
    expect(
      JSON.parse(fs.readFileSync(runFilePath('taken'), 'utf8')).startedAt
    ).toBe(newClaim.startedAt)
  })

  it('clears a dead engine and keeps the startup log', async () => {
    const { cleanupStaleLock, runDir, runFilePath, sessionFilePath } = load()
    // A pid that cannot be running: 0x7FFFFFFF is above every pid_max.
    seed('dead', 0x7fffffff)
    expect(await cleanupStaleLock('dead')).toBeNull()
    expect(fs.existsSync(runFilePath('dead'))).toBe(false)
    // The bearer token must not survive the engine that issued it.
    expect(fs.existsSync(sessionFilePath('dead'))).toBe(false)
    expect(fs.existsSync(path.join(runDir('dead'), 'engine-startup.log'))).toBe(
      true
    )
  })

  it('retires a non-empty startup log instead of deleting it', () => {
    // `engine-startup.log` is the engine's whole stderr, and in normal
    // operation the larger part of it is a plugin's own output —
    // `edge-currency-plugins` dumps a stack for every dropped socket. It was
    // unlinked on every clean stop, so that was the one surface carrying it
    // and the stop erased it. Moved into the log directory, where
    // `sweepOldLogs` ages it out with everything else.
    const { ensureRunDir, removeRunArtifacts, runDir } = load()
    const { cliLogsDir } = require('../../cli/engine/cliHome')
    ensureRunDir('noisy')
    fs.writeFileSync(
      path.join(runDir('noisy'), 'engine-startup.log'),
      'Error: Socket closed without error\n'
    )
    removeRunArtifacts('noisy')
    const retired = path.join(cliLogsDir(), 'engine-noisy-startup.log')
    expect(fs.existsSync(retired)).toBe(true)
    expect(fs.readFileSync(retired, 'utf8')).toContain('Socket closed')
    // And no empty profile directory left behind, which is what the unlink
    // was buying.
    expect(fs.existsSync(runDir('noisy'))).toBe(false)
  })

  it('deletes an empty startup log rather than keeping a blank file', () => {
    // The common case: nothing wrote to stderr, so there is nothing to keep
    // and one file per profile would otherwise accumulate in the log
    // directory for ever.
    const { ensureRunDir, removeRunArtifacts, runDir } = load()
    const { cliLogsDir } = require('../../cli/engine/cliHome')
    ensureRunDir('quiet')
    fs.writeFileSync(path.join(runDir('quiet'), 'engine-startup.log'), '')
    removeRunArtifacts('quiet')
    expect(
      fs.existsSync(path.join(cliLogsDir(), 'engine-quiet-startup.log'))
    ).toBe(false)
    expect(fs.existsSync(runDir('quiet'))).toBe(false)
  })

  it('keeps the socket and session when asked, clearing only the run file', async () => {
    const { removeRunArtifacts, runFilePath, sessionFilePath, socketPathFor } =
      load()
    // What a startup that claimed the profile and then lost the `listen` race
    // must do. The socket is the winner's and `session.json` is the user's;
    // removing them left the winner resident and unreachable, with every
    // later command spawning another engine on the same directory.
    seed('loser', process.pid)
    removeRunArtifacts('loser', {
      keepStartupLog: true,
      keepSocket: true,
      keepSession: true
    })
    expect(fs.existsSync(runFilePath('loser'))).toBe(false)
    expect(fs.existsSync(socketPathFor('loser'))).toBe(true)
    expect(fs.existsSync(sessionFilePath('loser'))).toBe(true)
  })

  it('treats an old malformed run file as no claim and removes the socket', async () => {
    const { cleanupStaleLock, ensureRunDir, runFilePath, socketPathFor } =
      load()
    ensureRunDir('broken')
    fs.writeFileSync(runFilePath('broken'), 'not json')
    fs.writeFileSync(socketPathFor('broken'), '')
    // Old, so it cannot be a claim being written right now: an engine that
    // died mid-write, or a file from a version this one cannot read. The
    // profile must not stay wedged.
    const old = new Date(Date.now() - 10 * 60_000)
    fs.utimesSync(runFilePath('broken'), old, old)
    expect(await cleanupStaleLock('broken')).toBeNull()
    expect(fs.existsSync(socketPathFor('broken'))).toBe(false)
  })

  it('leaves a claim that is still being written alone', async () => {
    const { cleanupStaleLock, ensureRunDir, runFilePath, socketPathFor } =
      load()
    ensureRunDir('claiming')
    // `claimRunFile` needs `wx` for the exclusion, so it cannot rename: the
    // claim is a create followed by a write, and a second engine starting
    // inside that window read a zero-length file. Treating it as no claim
    // unlinked the socket and run file of the engine that had just claimed
    // them, and both then believed they owned the profile.
    fs.writeFileSync(runFilePath('claiming'), '')
    fs.writeFileSync(socketPathFor('claiming'), '')
    expect(await cleanupStaleLock('claiming')).toBeNull()
    expect(fs.existsSync(socketPathFor('claiming'))).toBe(true)
    expect(fs.existsSync(runFilePath('claiming'))).toBe(true)
  })
})

describe('sweepStaleProfiles', () => {
  it('removes every profile no live process owns, except the caller', async () => {
    const {
      ensureRunDir,
      runDir,
      runFilePath,
      sessionFilePath,
      socketPathFor,
      sweepStaleProfiles
    } = load()
    const write = (profile: string, pid: number): void => {
      ensureRunDir(profile)
      fs.writeFileSync(
        runFilePath(profile),
        JSON.stringify({
          pid,
          apiVersion: '1',
          socketPath: socketPathFor(profile),
          tcpPort: null,
          appId: 'edge.app',
          testMode: false,
          startedAt: new Date().toISOString()
        })
      )
      fs.writeFileSync(sessionFilePath(profile), '{"sessionId":"sess_x"}')
    }
    write('orphan1', 0x7fffffff)
    write('orphan2', 0x7ffffffe)
    write('alive', process.pid)
    ensureRunDir('mine')

    expect(await sweepStaleProfiles('mine')).toBe(2)
    expect(fs.existsSync(runDir('orphan1'))).toBe(false)
    expect(fs.existsSync(runDir('orphan2'))).toBe(false)
    // A live engine's directory and the caller's own are untouched.
    expect(fs.existsSync(runFilePath('alive'))).toBe(true)
    expect(fs.existsSync(runDir('mine'))).toBe(true)
  })

  it('removes a profile directory that still holds a startup log', async () => {
    // The case the fixture above misses: it writes no `engine-startup.log`,
    // so the directory was already empty and `rmdirSync` succeeded whatever
    // the sweep kept. A real abandoned profile has one — the engine's stdio
    // is redirected into it — and the sweep used to pass
    // `keepStartupLog: true`, so `rmdirSync` always threw ENOTEMPTY, the
    // directory survived, and `removed++` still counted it. The
    // accumulation this function exists to bound carried on while its own
    // return value said otherwise.
    const {
      ensureRunDir,
      runDir,
      runFilePath,
      socketPathFor,
      sweepStaleProfiles
    } = load()
    ensureRunDir('logged')
    fs.writeFileSync(
      runFilePath('logged'),
      JSON.stringify({
        pid: 0x7ffffffd,
        apiVersion: '1',
        socketPath: socketPathFor('logged'),
        tcpPort: null,
        appId: 'edge.app',
        testMode: false,
        startedAt: new Date().toISOString()
      })
    )
    fs.writeFileSync(
      path.join(runDir('logged'), 'engine-startup.log'),
      '[edge-engine] something went wrong\n'
    )

    expect(await sweepStaleProfiles('mine')).toBe(1)
    expect(fs.existsSync(runDir('logged'))).toBe(false)
  })

  it('sweeps a live pid whose engine is long gone', async () => {
    const {
      ensureRunDir,
      runDir,
      runFilePath,
      sessionFilePath,
      socketPathFor,
      sweepStaleProfiles
    } = load()
    // The recycled-pid case. `process.kill(pid, 0)` succeeds for ever once
    // the OS hands the pid to something else, so testing the pid alone meant
    // the sweep permanently skipped the directories it exists to clear —
    // leaving `session.json`, a full-account bearer token, on disk in a
    // profile nothing would revisit. Backdated past the boot grace, because
    // that is what a recycled pid always is.
    ensureRunDir('recycled')
    fs.writeFileSync(
      runFilePath('recycled'),
      JSON.stringify({
        pid: process.pid,
        apiVersion: '1',
        socketPath: socketPathFor('recycled'),
        tcpPort: null,
        appId: 'edge.app',
        testMode: false,
        startedAt: new Date(Date.now() - 600_000).toISOString()
      })
    )
    fs.writeFileSync(sessionFilePath('recycled'), '{"sessionId":"sess_x"}')
    ensureRunDir('mine')

    expect(await sweepStaleProfiles('mine')).toBe(1)
    expect(fs.existsSync(sessionFilePath('recycled'))).toBe(false)
    expect(fs.existsSync(runDir('mine'))).toBe(true)
  })

  it('leaves a live profile alone when the probe could not answer', async () => {
    const {
      ensureRunDir,
      runFilePath,
      sessionFilePath,
      socketPathFor,
      sweepStaleProfiles
    } = load()
    // This removal is the wider of the two: the socket, the run file *and*
    // `session.json`, which belongs to the user rather than to the engine.
    // One failed probe in the sweeping process therefore deleted a live
    // engine's artifacts and the user's session, leaving that engine
    // resident, unreachable and unstoppable while every later command on the
    // profile spawned another.
    ensureRunDir('serving')
    fs.writeFileSync(
      runFilePath('serving'),
      JSON.stringify({
        pid: process.pid,
        apiVersion: '1',
        socketPath: socketPathFor('serving'),
        tcpPort: null,
        appId: 'edge.app',
        testMode: false,
        startedAt: new Date(Date.now() - 600_000).toISOString()
      })
    )
    fs.writeFileSync(sessionFilePath('serving'), '{"sessionId":"sess_x"}')
    ensureRunDir('mine')

    expect(
      await sweepStaleProfiles('mine', { probeSocket: async () => 'unknown' })
    ).toBe(0)
    expect(fs.existsSync(runFilePath('serving'))).toBe(true)
    expect(fs.existsSync(sessionFilePath('serving'))).toBe(true)
  })

  it('does not sweep a profile claimed while it was probing', async () => {
    const {
      ensureRunDir,
      runFilePath,
      sessionFilePath,
      socketPathFor,
      sweepStaleProfiles
    } = load()
    ensureRunDir('contested')
    const stale = {
      pid: process.pid,
      apiVersion: '1',
      socketPath: socketPathFor('contested'),
      tcpPort: null,
      appId: 'edge.app',
      testMode: false,
      startedAt: new Date(Date.now() - 600_000).toISOString()
    }
    fs.writeFileSync(runFilePath('contested'), JSON.stringify(stale))
    fs.writeFileSync(sessionFilePath('contested'), '{"sessionId":"sess_x"}')
    ensureRunDir('mine')

    expect(
      await sweepStaleProfiles('mine', {
        probeSocket: async () => {
          fs.writeFileSync(
            runFilePath('contested'),
            JSON.stringify({ ...stale, startedAt: new Date().toISOString() })
          )
          return 'absent'
        }
      })
    ).toBe(0)
    // The new owner's run file and the session it is about to use are both
    // still there: the verdict was formed before that engine existed.
    expect(fs.existsSync(runFilePath('contested'))).toBe(true)
    expect(fs.existsSync(sessionFilePath('contested'))).toBe(true)
  })

  it('does nothing when there is no run root yet', async () => {
    const { sweepStaleProfiles } = load()
    expect(await sweepStaleProfiles('mine')).toBe(0)
  })
})

/**
 * The profile hash must not change when the data directory is created.
 *
 * The client hashes before `mkdir` and the engine hashes after, so a
 * `realpath` that gave up on a missing leaf gave the two sides different
 * answers under a symlinked path — on macOS, every first run with
 * `-d /tmp/…`. The engine bound its socket under one profile, the client
 * polled another, and the command failed with a 30-second spawn timeout
 * while a healthy detached engine stayed behind.
 */
describe('canonicalDirectory', () => {
  it('answers the same before and after the directory exists', () => {
    const { canonicalDirectory } = load()
    const real = fs.mkdtempSync(path.join(os.tmpdir(), 'edge-canon-'))
    const link = `${real}-link`
    fs.symlinkSync(real, link)
    try {
      const wanted = path.join(link, 'data')
      const before = canonicalDirectory(wanted)
      fs.mkdirSync(path.join(link, 'data'))
      expect(canonicalDirectory(wanted)).toBe(before)
      // And it is the target's path, not the symlink's, in both.
      expect(before.startsWith(fs.realpathSync.native(real))).toBe(true)
    } finally {
      fs.rmSync(real, { recursive: true, force: true })
      fs.unlinkSync(link)
    }
  })

  it('is the same profile through a symlink and its target', () => {
    const { canonicalDirectory, profileHash } = load()
    const real = fs.mkdtempSync(path.join(os.tmpdir(), 'edge-canon-'))
    const link = `${real}-link`
    fs.symlinkSync(real, link)
    try {
      const key = { appId: '', testMode: false }
      expect(profileHash({ ...key, directory: link })).toBe(
        profileHash({ ...key, directory: real })
      )
      expect(canonicalDirectory(`${link}/`)).toBe(canonicalDirectory(real))
    } finally {
      fs.rmSync(real, { recursive: true, force: true })
      fs.unlinkSync(link)
    }
  })
})

/**
 * How a probe's verdict is reached, not only what callers do with it.
 *
 * Every case above that needs `'unknown'` injects it through
 * `DiscoveryProbes.probeSocket`, so replacing the classification with
 * `'absent'` — or letting the timeout resolve `'absent'` — kept the suite
 * green while one EMFILE in a starting process unlinked a healthy engine's
 * live socket again.
 */
describe('probe classification', () => {
  it('reads only the kernel’s answers about the path as absent', () => {
    const { classifyProbeError } = load()
    for (const code of [
      'ECONNREFUSED',
      'EINVAL',
      'ENAMETOOLONG',
      'ENOENT',
      'ENOTDIR',
      'ENOTSOCK'
    ]) {
      expect(classifyProbeError(Object.assign(new Error(code), { code }))).toBe(
        'absent'
      )
    }
  })

  it('reads a failure of the probe itself as unknown', () => {
    const { classifyProbeError } = load()
    for (const code of ['EMFILE', 'ENFILE', 'EACCES']) {
      expect(classifyProbeError(Object.assign(new Error(code), { code }))).toBe(
        'unknown'
      )
    }
    expect(classifyProbeError(new Error('no code'))).toBe('unknown')
    expect(classifyProbeError('a string')).toBe('unknown')
    expect(classifyProbeError(undefined)).toBe('unknown')
  })

  it('reads a connect that throws as unknown', async () => {
    const { probeEngineSocket } = load()
    const verdict = await probeEngineSocket('/nowhere', () => {
      throw Object.assign(new Error('EMFILE'), { code: 'EMFILE' })
    })
    expect(verdict).toBe('unknown')
  })

  it('reads a connect that never completes as unknown', async () => {
    // A full accept backlog on a busy engine leaves the connect pending, so
    // a timeout is what a live engine looks like under load.
    const { probeEngineSocket } = load()
    const { EventEmitter } = require('events')
    const pending = Object.assign(new EventEmitter(), {
      setTimeout(this: any) {
        // A promise reaction: this suite's timers are jest's fakes, and so
        // are `setImmediate` and `queueMicrotask`.
        Promise.resolve()
          .then(() => this.emit('timeout'))
          .catch(() => {})
        return this
      },
      destroy() {}
    })
    const verdict = await probeEngineSocket(
      '/busy',
      () => pending as net.Socket
    )
    expect(verdict).toBe('unknown')
  })

  it('reads a real listener as listening and a stale socket file as absent', async () => {
    const { probeEngineSocket } = load()
    const socketPath = path.join(home, 'probe.sock')
    const server = net.createServer()
    await new Promise<void>(resolve => server.listen(socketPath, resolve))
    try {
      expect(await probeEngineSocket(socketPath)).toBe('listening')
    } finally {
      await new Promise<void>(resolve =>
        server.close(() => {
          resolve()
        })
      )
    }
    expect(await probeEngineSocket(path.join(home, 'gone.sock'))).toBe('absent')
  })
})
