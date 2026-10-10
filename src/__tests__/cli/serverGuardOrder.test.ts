import { describe, expect, it, jest } from '@jest/globals'
import type { IncomingMessage, ServerResponse } from 'http'

import type { EngineState } from '../../cli/engine/router'
import { Router } from '../../cli/engine/router'
import { createRequestHandler } from '../../cli/engine/server'
import type { TcpGuard } from '../../cli/engine/transportAuth'
import { TCP_TOKEN_HEADER } from '../../cli/engine/transportAuth'

/**
 * An unauthenticated request must not touch the engine's idle clock.
 *
 * The guard runs above `idle.touch()` and `idle.beginRequest()` for one
 * reason: before it did, every *rejected* request pushed `idleShutdownAt` out
 * by a full `--idle-timeout`, so any other local process — the threat
 * `transportAuth.ts` names — could poll the port once a minute with no token
 * and hold the daemon resident for good, with its `EdgeContext` and every
 * plugin's polling alive. The offline suite asserts a log line was written,
 * which its own comment admits is not this; swapping those two statements
 * back is invisible to it. `createRequestHandler` is exported as the seam for
 * exactly this, and nothing used it.
 */
const TOKEN = 'a'.repeat(43)

/**
 * Drain the microtask queue.
 *
 * `createRequestHandler` returns a plain function that starts
 * `handleRequest` without awaiting it, and `jestSetup.js` fakes every timer
 * for the whole repo — so `setImmediate` never fires and waiting on one
 * hangs the case rather than letting the handler finish.
 */
async function settle(): Promise<void> {
  for (let i = 0; i < 20; i++) await Promise.resolve()
}

function makeGuard(): TcpGuard {
  return {
    token: TOKEN,
    allowedHostnames: new Set(['127.0.0.1', 'localhost'])
  } as unknown as TcpGuard
}

/** The three pieces of `EngineState` this path reads, and nothing else. */
function makeState(): {
  state: EngineState
  touch: jest.Mock
  beginRequest: jest.Mock
  warn: jest.Mock
} {
  const touch = jest.fn()
  const beginRequest = jest.fn()
  const endRequest = jest.fn()
  const warn = jest.fn()
  return {
    touch,
    beginRequest,
    warn,
    state: {
      idle: { touch, beginRequest, endRequest },
      logger: { warn, error: jest.fn(), info: jest.fn() },
      shuttingDown: false
    } as unknown as EngineState
  }
}

/** A response that records what was written to it. */
function makeRes(): { res: ServerResponse; status: () => number } {
  let statusCode = 0
  const res = {
    setHeader: () => {},
    get statusCode() {
      return statusCode
    },
    set statusCode(value: number) {
      statusCode = value
    },
    writableEnded: false,
    end: () => {}
  }
  return { res: res as unknown as ServerResponse, status: () => statusCode }
}

function makeReq(headers: Record<string, string>): IncomingMessage {
  return {
    method: 'GET',
    url: '/engine/status',
    headers,
    on: () => {},
    resume: () => {}
  } as unknown as IncomingMessage
}

describe('createRequestHandler on the TCP transport', () => {
  const router = new Router()

  it('refuses a request with no token without moving the idle clock', async () => {
    const { state, touch, beginRequest, warn } = makeState()
    const { res, status } = makeRes()
    createRequestHandler(
      state,
      router,
      makeGuard()
    )(makeReq({ host: '127.0.0.1' }), res)
    await settle()

    expect(status()).toBe(401)
    // The whole point: a caller that cannot authenticate learns nothing about
    // this engine and cannot keep it alive.
    expect(touch).not.toHaveBeenCalled()
    expect(beginRequest).not.toHaveBeenCalled()
    // And the attempt is recorded, because a rejected TCP request is the only
    // sign of a probe.
    expect(warn).toHaveBeenCalled()
  })

  it('refuses a foreign Host without moving the idle clock', async () => {
    const { state, touch, beginRequest } = makeState()
    const { res, status } = makeRes()
    createRequestHandler(
      state,
      router,
      makeGuard()
    )(makeReq({ host: 'evil.example', [TCP_TOKEN_HEADER]: TOKEN }), res)
    await settle()

    expect(status()).toBe(403)
    expect(touch).not.toHaveBeenCalled()
    expect(beginRequest).not.toHaveBeenCalled()
  })

  it('lets an authenticated request reach the clock', async () => {
    // The other half: the ordering must not have turned the guard into a
    // refusal of everything.
    const { state, touch, beginRequest } = makeState()
    const { res } = makeRes()
    createRequestHandler(
      state,
      router,
      makeGuard()
    )(makeReq({ host: '127.0.0.1', [TCP_TOKEN_HEADER]: TOKEN }), res)
    await settle()

    expect(touch).toHaveBeenCalled()
    expect(beginRequest).toHaveBeenCalled()
  })
})

/**
 * A malformed `Host:` is the caller's, not the engine's.
 *
 * Node reports a present-but-empty header as the empty string, so `??` let
 * `new URL('/', 'http://')` through — which throws — and the catch-all
 * answered `500 INTERNAL_ERROR` with a stack in the log. Driven with no
 * `guard`, which is the unix-socket path this reaches.
 */
describe('the Host header', () => {
  const router = new Router()

  it('substitutes localhost for an absent header', async () => {
    const { state } = makeState()
    const { res, status } = makeRes()
    createRequestHandler(state, router)(makeReq({}), res)
    await settle()
    expect(status()).not.toBe(500)
  })

  it('substitutes localhost for an empty one', async () => {
    // The arm that is the whole fix: `headers.host` is `''`, not nullish.
    const { state } = makeState()
    const { res, status } = makeRes()
    createRequestHandler(state, router)(makeReq({ host: '' }), res)
    await settle()
    expect(status()).not.toBe(500)
  })

  it('still answers normally for a sane header', async () => {
    const { state } = makeState()
    const { res, status } = makeRes()
    createRequestHandler(state, router)(makeReq({ host: 'localhost' }), res)
    await settle()
    expect(status()).not.toBe(500)
  })
})
