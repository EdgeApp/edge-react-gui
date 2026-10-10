import { describe, expect, it } from '@jest/globals'
import fs from 'fs'
import os from 'os'
import path from 'path'

import {
  clientConfig,
  clientTcpPort,
  clientTimeoutMs,
  legacyLoginAction
} from '../../cli/client/clientArgs'
import { EXIT, exitCodeForApiError } from '../../cli/client/exitCodes'
import { UsageError } from '../../cli/command'
import { MAX_TIMER_MS } from '../../cli/timerCeiling'

/**
 * The client's global flags, which nothing could load.
 *
 * They lived in `src/cli/index.ts`, which calls `main()` at import, so the
 * `--timeout` ceiling and the `-c` mapping both landed with nothing seeing
 * the error class that decides the exit code.
 */
describe('clientTimeoutMs', () => {
  it('reads seconds as milliseconds', () => {
    expect(clientTimeoutMs('30')).toBe(30_000)
    expect(clientTimeoutMs('0.5')).toBe(500)
    expect(clientTimeoutMs(undefined)).toBeUndefined()
  })

  it('refuses a value above Node’s timer ceiling as a usage error', () => {
    // Node holds a timer's delay in a signed 32-bit int and clamps anything
    // above it to 1 ms, so `--timeout=1e9` — how a caller asks for
    // "effectively never" on `broadcast-tx` — failed *instantly* with
    // `REQUEST_TIMEOUT` and exit 6, the exact opposite.
    expect(() => clientTimeoutMs('1e9')).toThrow(UsageError)
    expect(() => clientTimeoutMs('1e9')).toThrow(/Node's timer ceiling/)
    const ceiling = String(Math.floor(MAX_TIMER_MS / 1000))
    expect(clientTimeoutMs(ceiling)).toBeLessThanOrEqual(MAX_TIMER_MS)
  })

  it('refuses what is not a positive number', () => {
    for (const raw of ['0', '-5', 'soon', 'NaN', 'Infinity']) {
      expect(() => clientTimeoutMs(raw)).toThrow(UsageError)
    }
  })
})

describe('clientTcpPort', () => {
  it('reads a port and an absent flag', () => {
    expect(clientTcpPort('8080')).toBe(8080)
    expect(clientTcpPort(undefined)).toBeNull()
  })

  it('refuses a non-port as a usage error, not as the engine’s stack', () => {
    // `Number('abc')` is `NaN`, which reached the engine as `--tcp=NaN` and
    // cost a 30-second spawn timeout followed by the engine's stack.
    expect(() => clientTcpPort('abc')).toThrow(UsageError)
  })
})

describe('clientConfig', () => {
  it('reports a missing explicit -c as a usage error', () => {
    // A plain `Error` here printed `INTERNAL_ERROR` and exited 1 for a typo
    // in a path, with no usage line.
    const missing = path.join(
      os.tmpdir(),
      `no-such-edge-cli-${process.pid}.json`
    )
    expect(() => clientConfig(missing)).toThrow(UsageError)
  })

  it('reports an unreadable file as a usage error too', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'edge-cli-cfg-'))
    const file = path.join(dir, 'config.json')
    fs.writeFileSync(file, '{ not json')
    try {
      expect(() => clientConfig(file)).toThrow(UsageError)
    } finally {
      fs.rmSync(dir, { recursive: true, force: true })
    }
  })

  it('reads a good file', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'edge-cli-cfg-'))
    const file = path.join(dir, 'config.json')
    fs.writeFileSync(file, JSON.stringify({ appId: 'edge.test' }))
    try {
      expect(clientConfig(file).appId).toBe('edge.test')
    } finally {
      fs.rmSync(dir, { recursive: true, force: true })
    }
  })
})

describe('the exit code those refusals produce', () => {
  it('is 2, by either route a UsageError takes', () => {
    // `main` sets `EXIT.USAGE` for a `UsageError` and writes the `USAGE`
    // envelope; a script reading either the code or the envelope sees 2.
    expect(EXIT.USAGE).toBe(2)
    expect(exitCodeForApiError('USAGE', 400)).toBe(2)
  })
})

/**
 * The legacy `-u`/`-p` helper chooses the account.
 *
 * It used to run only when no session existed, and the session file is per
 * profile, so `-u alice -p … delete-remote-account --yes` deleted whichever
 * account had logged in there last.
 */
describe('legacyLoginAction', () => {
  it('uses the saved session when it is the named user’s', () => {
    expect(
      legacyLoginAction({
        username: 'alice',
        password: 'pw',
        sessionId: 's-1',
        heldBy: 'alice'
      })
    ).toStrictEqual({ kind: 'use-session' })
  })

  it('matches the name as core spells it', () => {
    // Core lowercases and trims a username, so `-u Alice` names the session
    // the file records as `alice`, and must not log in again.
    expect(
      legacyLoginAction({
        username: ' Alice ',
        password: 'pw',
        sessionId: 's-1',
        heldBy: 'alice'
      })
    ).toStrictEqual({ kind: 'use-session' })
  })

  it('logs in as the named user over someone else’s session', () => {
    expect(
      legacyLoginAction({
        username: 'alice',
        password: 'pw',
        sessionId: 's-1',
        heldBy: 'bob'
      })
    ).toStrictEqual({ kind: 'login' })
  })

  it('refuses, naming both, when it cannot log in as the named user', () => {
    const action = legacyLoginAction({
      username: 'alice',
      password: undefined,
      sessionId: 's-1',
      heldBy: 'bob'
    })
    expect(action.kind).toBe('refuse')
    if (action.kind === 'refuse') {
      expect(action.reason).toContain('alice')
      expect(action.reason).toContain('bob')
    }
  })

  it('keeps today’s answers when -u is not given', () => {
    expect(
      legacyLoginAction({
        username: undefined,
        password: undefined,
        sessionId: 's-1',
        heldBy: 'bob'
      })
    ).toStrictEqual({ kind: 'use-session' })
    expect(
      legacyLoginAction({
        username: undefined,
        password: undefined,
        sessionId: null,
        heldBy: undefined
      })
    ).toStrictEqual({
      kind: 'refuse',
      reason: 'Please log in first (no sessionId)'
    })
  })
})
