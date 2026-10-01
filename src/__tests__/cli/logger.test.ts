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
