import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest
} from '@jest/globals'
import fs from 'fs'
import os from 'os'
import path from 'path'

import type * as LoggerModule from '../../cli/engine/logger'

/**
 * `logger` resolves the home directory at call time, so stubbing
 * `os.homedir` keeps every case off the developer's real `~/.edge-cli`.
 * Setting `HOME` is *not* enough: under jest `os.homedir()` does not read it,
 * and the sweep would then delete real logs.
 */
let home: string
let homedir: jest.SpiedFunction<typeof os.homedir>

type Logger = typeof LoggerModule
function load(): Logger {
  return require('../../cli/engine/logger')
}

beforeEach(() => {
  home = fs.mkdtempSync(path.join(os.tmpdir(), 'edge-logger-'))
  homedir = jest.spyOn(os, 'homedir').mockReturnValue(home)
  jest.resetModules()
})
afterEach(() => {
  homedir.mockRestore()
  fs.rmSync(home, { recursive: true, force: true })
})

const DAY = 86_400_000

function logsDir(): string {
  return path.join(home, '.edge-cli', 'logs')
}

/** Seed one log file, `ageDays` old. */
function seedLog(name: string, ageDays: number): string {
  fs.mkdirSync(logsDir(), { recursive: true })
  const file = path.join(logsDir(), name)
  fs.writeFileSync(file, 'log line\n')
  const when = new Date(Date.now() - ageDays * DAY)
  fs.utimesSync(file, when, when)
  return file
}

/** Seed a run file claiming `pid` for `profile`. */
function seedRunFile(profile: string, pid: number): void {
  const dir = path.join(home, '.edge-cli', 'run', profile)
  fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(path.join(dir, 'engine.json'), JSON.stringify({ pid }))
}

describe('sweepOldLogs', () => {
  it('removes a back-dated engine log and keeps a fresh one', () => {
    const { sweepOldLogs } = load()
    const old = seedLog('engine-aaaa.log', 30)
    const fresh = seedLog('engine-bbbb.log', 1)
    expect(sweepOldLogs()).toBe(1)
    expect(fs.existsSync(old)).toBe(false)
    expect(fs.existsSync(fresh)).toBe(true)
  })

  it('removes a rolled log too', () => {
    const { sweepOldLogs } = load()
    const rolled = seedLog('engine-aaaa.log.1', 30)
    expect(sweepOldLogs()).toBe(1)
    expect(fs.existsSync(rolled)).toBe(false)
  })

  it('leaves a file that is not an engine log', () => {
    const { sweepOldLogs } = load()
    const other = seedLog('something-else.log', 30)
    expect(sweepOldLogs()).toBe(0)
    expect(fs.existsSync(other)).toBe(true)
  })

  it('keeps a log whose profile still has a live run file', () => {
    const { sweepOldLogs } = load()
    // `unlinkSync` succeeds on POSIX for a file another process holds open,
    // so the age test alone let one engine delete a live engine's log: the
    // writer kept writing to an unlinked inode while `logger.logPath` still
    // named the file.
    const live = seedLog('engine-liveprof.log', 30)
    seedRunFile('liveprof', process.pid)
    expect(sweepOldLogs()).toBe(0)
    expect(fs.existsSync(live)).toBe(true)
  })

  it('removes a log whose profile names a dead process', () => {
    const { sweepOldLogs } = load()
    const dead = seedLog('engine-deadprof.log', 30)
    // 0x7FFFFFFF is above every pid_max.
    seedRunFile('deadprof', 0x7fffffff)
    expect(sweepOldLogs()).toBe(1)
    expect(fs.existsSync(dead)).toBe(false)
  })

  it('keeps the caller’s own log whatever its age', () => {
    const { sweepOldLogs } = load()
    const mine = seedLog('engine-mine.log', 30)
    expect(sweepOldLogs(undefined, mine)).toBe(0)
    expect(fs.existsSync(mine)).toBe(true)
  })

  it('returns 0 when there is no logs directory yet', () => {
    const { sweepOldLogs } = load()
    expect(sweepOldLogs()).toBe(0)
  })

  it('honours an explicit max age', () => {
    const { sweepOldLogs } = load()
    const twoDays = seedLog('engine-aaaa.log', 2)
    expect(sweepOldLogs(DAY)).toBe(1)
    expect(fs.existsSync(twoDays)).toBe(false)
  })
})

/**
 * The rename-and-reopen, which was reachable only by writing 8 MB.
 *
 * What it does: end the current stream, rename the log to `.1`, open a fresh
 * one at `0o600` with its own `error` handler, and reset the byte count —
 * with a `catch` that keeps writing to the handle it has if the rename
 * fails.
 */
describe('EngineLogger roll', () => {
  /** Flush the write stream, which is what puts the bytes on disk. */
  async function closed(logger: LoggerModule.EngineLogger): Promise<void> {
    await logger.close()
  }

  /**
   * An existing log, so the roll has a file to rename.
   *
   * `createWriteStream` opens asynchronously and `jestSetup.js` fakes every
   * timer, so there is no way to wait for the first flush here — and a roll
   * before it finds nothing to rename. Seeding the file is also closer to the
   * real case: an engine rolls a log that has been there for hours. The
   * constructor reads its size, so one line then crosses the ceiling.
   */
  function seedCurrentLog(profile: string, bytes: number): string {
    fs.mkdirSync(logsDir(), { recursive: true })
    const file = path.join(logsDir(), `engine-${profile}.log`)
    fs.writeFileSync(file, 'x'.repeat(bytes - 1) + '\n', { mode: 0o600 })
    return file
  }

  it('renames the log once the ceiling is crossed', async () => {
    const { EngineLogger } = load()
    // Small enough that the second line crosses it.
    seedCurrentLog('rollprof', 100)
    const logger = new EngineLogger('rollprof', 150)
    logger.info('the line that takes the count past the ceiling')
    logger.info('the line after the roll')
    await closed(logger)

    const previous = `${logger.logPath}.1`
    expect(fs.existsSync(previous)).toBe(true)
    expect(fs.existsSync(logger.logPath)).toBe(true)

    // The line that tripped the threshold belongs to the file it filled, not
    // to the fresh one: the roll happens after the write.
    const rolled = fs.readFileSync(previous, 'utf8')
    expect(rolled).toContain('past the ceiling')
    expect(rolled).not.toContain('after the roll')

    const current = fs.readFileSync(logger.logPath, 'utf8')
    expect(current).toContain('after the roll')
    expect(current).not.toContain('past the ceiling')
  })

  it('opens the fresh log owner-only', async () => {
    const { EngineLogger } = load()
    seedCurrentLog('modeprof', 100)
    const logger = new EngineLogger('modeprof', 150)
    logger.info('the line that takes the count past the ceiling')
    logger.info('the line after the roll')
    await closed(logger)

    // An engine log carries usernames, login ids and core diagnostics, so the
    // file created by the roll has to be as private as the first one.
    expect(fs.statSync(logger.logPath).mode & 0o777).toBe(0o600)
    expect(fs.statSync(`${logger.logPath}.1`).mode & 0o777).toBe(0o600)
  })

  it('keeps the line when the rename fails', async () => {
    const { EngineLogger } = load()
    seedCurrentLog('failprof', 100)
    const logger = new EngineLogger('failprof', 150)
    const rename = jest.spyOn(fs, 'renameSync').mockImplementation(() => {
      throw new Error('EPERM')
    })
    try {
      logger.info('the line that takes the count past the ceiling')
      logger.info('the line after the failed rename')
      await closed(logger)
    } finally {
      rename.mockRestore()
    }

    // Nothing was renamed, so there is one file, it has every line, and the
    // lines are in order: a failed roll must cost neither a line nor its
    // place. The old behaviour ended the stream before learning the rename
    // had failed, which left two streams appending to one path.
    expect(fs.existsSync(`${logger.logPath}.1`)).toBe(false)
    const text = fs.readFileSync(logger.logPath, 'utf8')
    expect(text).toContain('past the ceiling')
    expect(text).toContain('after the failed rename')
    expect(text.indexOf('past the ceiling')).toBeLessThan(
      text.indexOf('after the failed rename')
    )
  })

  it('runs without a file log rather than dying when it cannot open one', async () => {
    const { EngineLogger } = load()
    const open = jest.spyOn(fs, 'openSync').mockImplementation((() => {
      const error: NodeJS.ErrnoException = new Error('EACCES: permission')
      error.code = 'EACCES'
      throw error
    }) as never)
    const warned = jest.spyOn(console, 'error').mockImplementation(() => {})
    try {
      // The realistic trigger: one `sudo edge-cli …` leaves the log
      // root-owned, and every later non-root start of that profile used to
      // die at construction with a raw stack — `openSync` throws before the
      // `'error'` handler exists, so the policy this file states, that
      // logging is never worth the process, was not what it did.
      const logger = new EngineLogger('eaccesprof')
      logger.info('a line that has nowhere to go')
      await logger.close()
      expect(warned).toHaveBeenCalled()
      expect(String(warned.mock.calls[0][0])).toContain(
        'Continuing without a file log'
      )
    } finally {
      open.mockRestore()
      warned.mockRestore()
    }
  })

  it('does not roll below the ceiling', async () => {
    const { EngineLogger } = load()
    seedCurrentLog('smallprof', 100)
    const logger = new EngineLogger('smallprof', 8 * 1024 * 1024)
    logger.info('one short line')
    await closed(logger)
    expect(fs.existsSync(`${logger.logPath}.1`)).toBe(false)
  })
})

/**
 * A log the engine cannot write must cost the lines and nothing else.
 *
 * The stream's `'error'` handler nulls it — EACCES, ENOSPC, a logs directory
 * that went read-only mid-run — and `write` kept counting bytes past that.
 * So every further `maxBytes` of *discarded* text called `roll()`, which
 * renamed the log over `.1` and opened a stream that failed the same way:
 * the one previous generation this class promises to keep, clobbered
 * repeatedly by an empty file, which is the only record of what the daemon
 * was doing when the disk filled.
 */
describe('EngineLogger with a dead stream', () => {
  it('does not roll on output it is discarding', async () => {
    const { EngineLogger } = load()
    fs.mkdirSync(logsDir(), { recursive: true })
    const file = path.join(logsDir(), 'engine-deadstream.log')
    fs.writeFileSync(file, 'x'.repeat(99) + '\n', { mode: 0o600 })

    const logger = new EngineLogger('deadstream', 150)
    // What the `'error'` handler does, which is the only way the stream is
    // nulled: a write failure the process must survive.
    ;(logger as unknown as { stream: unknown }).stream = null
    // And the file stays unwritable, so `reopen` cannot bring it back. That
    // is the state this case is about: with the file writable again,
    // reopening and carrying on is the right answer, which the next case
    // asserts.
    ;(logger as unknown as { openStream: () => never }).openStream = () => {
      throw new Error('ENOSPC: no space left on device')
    }

    for (let i = 0; i < 50; i++) {
      logger.info('a line nobody will ever read')
    }
    await logger.close()

    // No generation was created, and the file that was there is untouched.
    expect(fs.existsSync(`${file}.1`)).toBe(false)
    expect(fs.readFileSync(file, 'utf8')).toBe('x'.repeat(99) + '\n')
  })

  it('reopens the file rather than going quiet for ever', async () => {
    // `roll()` nulls the stream before it renames, so a single failed
    // reopen — EMFILE, a momentary ENOSPC, a logs directory read-only for a
    // second — used to be permanent: `write` returns early on a null
    // stream, so `engine-<profile>.log` stopped existing for the life of
    // the daemon while `logger.logPath` and the `Ready` line still named
    // it, and the only notice went to `engine-startup.log`, which the next
    // ordinary stop deletes.
    const { EngineLogger } = load()
    fs.mkdirSync(logsDir(), { recursive: true })
    const file = path.join(logsDir(), 'engine-reopen.log')

    const logger = new EngineLogger('reopen', 1024 * 1024)
    logger.info('before')
    ;(logger as unknown as { stream: unknown }).stream = null

    logger.info('after')
    await logger.close()

    const text = fs.readFileSync(file, 'utf8')
    expect(text).toContain('before')
    expect(text).toContain('after')
  })

  it('survives an error on the stream a roll left behind', async () => {
    // `roll()` keeps the old stream alive as `previous` while it drains, so
    // its `'error'` handler can fire *after* the new stream is assigned.
    // Both handlers used to clear `this.stream` unconditionally, so an
    // out-of-space error on the old stream retired the healthy new one and
    // the daemon ran with no file log for the rest of its life — with no
    // re-open path and one stderr line in a startup log a clean stop
    // deletes.
    const { EngineLogger } = load()
    fs.mkdirSync(logsDir(), { recursive: true })
    const file = path.join(logsDir(), 'engine-rollerror.log')
    fs.writeFileSync(file, 'x'.repeat(99) + '\n', { mode: 0o600 })

    const logger = new EngineLogger('rollerror', 150)
    const before = (logger as unknown as { stream: fs.WriteStream }).stream
    logger.info('the line that fills the first generation')
    const after = (logger as unknown as { stream: fs.WriteStream }).stream
    expect(after).not.toBe(before)

    // The pre-roll stream fails while draining. Quietly, because the
    // handler's own `console.error` is not what is under test.
    const quiet = jest.spyOn(console, 'error').mockImplementation(() => {})
    try {
      before.emit('error', new Error('ENOSPC: no space left on device'))
    } finally {
      quiet.mockRestore()
    }

    // The healthy stream is still the logger's, and still takes writes.
    expect((logger as unknown as { stream: unknown }).stream).toBe(after)
    logger.info('a line that has to reach the new generation')
    await logger.close()
    expect(fs.readFileSync(file, 'utf8')).toContain('reach the new generation')
  })

  it('awaits every rolled generation, not just the last', async () => {
    const { EngineLogger } = load()
    fs.mkdirSync(logsDir(), { recursive: true })
    const file = path.join(logsDir(), 'engine-tworolls.log')
    fs.writeFileSync(file, 'x'.repeat(99) + '\n', { mode: 0o600 })

    const logger = new EngineLogger('tworolls', 150)
    const flushes = (logger as unknown as { rolledFlushes: Set<unknown> })
      .rolledFlushes
    logger.info('the line that fills the first generation')
    expect(flushes.size).toBe(1)
    // A second roll, before the first generation's `end()` has settled: one
    // slot was overwritten here, and nothing awaited the first callback.
    logger.info('x'.repeat(200))
    expect(flushes.size).toBe(2)

    await logger.close()
    expect(flushes.size).toBe(0)
  })
})
