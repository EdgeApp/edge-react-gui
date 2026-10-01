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

  it('treats a malformed run file as no claim and removes the socket', async () => {
    const { cleanupStaleLock, ensureRunDir, runFilePath, socketPathFor } =
      load()
    ensureRunDir('broken')
    fs.writeFileSync(runFilePath('broken'), 'not json')
    fs.writeFileSync(socketPathFor('broken'), '')
    // A live engine always has a well-formed run file, because
    // `claimRunFile` writes it before anything binds — so an unreadable one
    // is not a claim, and the profile must not stay wedged.
    expect(await cleanupStaleLock('broken')).toBeNull()
    expect(fs.existsSync(socketPathFor('broken'))).toBe(false)
  })
})

describe('sweepStaleProfiles', () => {
  it('removes every profile no live process owns, except the caller', () => {
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

    expect(sweepStaleProfiles('mine')).toBe(2)
    expect(fs.existsSync(runDir('orphan1'))).toBe(false)
    expect(fs.existsSync(runDir('orphan2'))).toBe(false)
    // A live engine's directory and the caller's own are untouched.
    expect(fs.existsSync(runFilePath('alive'))).toBe(true)
    expect(fs.existsSync(runDir('mine'))).toBe(true)
  })

  it('does nothing when there is no run root yet', () => {
    const { sweepStaleProfiles } = load()
    expect(sweepStaleProfiles('mine')).toBe(0)
  })
})
