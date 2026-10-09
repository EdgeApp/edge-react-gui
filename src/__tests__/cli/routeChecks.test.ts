import { afterEach, describe, expect, it, jest } from '@jest/globals'
import { asNumber, asObject, asString } from 'cleaners'

import type { RouteSpec } from '../../cli/engine/route'
import { checkResponse, queryToObject } from '../../cli/engine/route'
import type { RouteContext } from '../../cli/engine/router'

/**
 * The two decisions `route.ts` makes about a request and a response.
 *
 * `queryToObject` runs on every routed request; what is unreachable from the
 * CLI is its empty-value branch, because `commandArgs.ts` refuses `--flag=`
 * before a request exists — so only a raw REST call can exercise that arm,
 * and the raw calls in the offline suites touch three routes.
 * `checkResponse`'s default mode is `warn`, which is what production uses
 * and what no suite asserted: both offline suites run in `strict` now, so
 * they would fail on drift rather than log it, and the behaviour the engine
 * actually falls back to — log it and send the body through untouched — is
 * covered here.
 */

describe('queryToObject', () => {
  it('drops an empty value and keeps every other', () => {
    // `?b=` is the one layer that decides an empty parameter is an absent
    // one, so a required field reports as missing rather than arriving as
    // `''` and `asOptional`'s fallback applies. `?c=0` must survive: it is a
    // value, and three downstream branches once assumed otherwise.
    expect(queryToObject(new URLSearchParams('a=1&b=&c=0'))).toStrictEqual({
      a: '1',
      c: '0'
    })
  })

  it('keeps a value that is only whitespace', () => {
    // Not this layer's call: `' '` is text the caller sent, and the field's
    // own cleaner decides whether it is acceptable. Trimming here would turn
    // one route's validation error into a different route's missing field.
    expect(queryToObject(new URLSearchParams('a=%20'))).toStrictEqual({
      a: ' '
    })
  })

  it('takes the last of a repeated parameter', () => {
    // `URLSearchParams.entries()` yields both, and the later assignment wins.
    // No route declares a repeated query field, so this pins the behaviour
    // rather than endorsing it.
    expect(queryToObject(new URLSearchParams('a=1&a=2'))).toStrictEqual({
      a: '2'
    })
  })

  it('answers an empty object for an empty query', () => {
    expect(queryToObject(new URLSearchParams(''))).toStrictEqual({})
  })
})

describe('checkResponse', () => {
  const previous = process.env.EDGE_CLI_CHECK_RESPONSES
  afterEach(() => {
    if (previous == null) delete process.env.EDGE_CLI_CHECK_RESPONSES
    else process.env.EDGE_CLI_CHECK_RESPONSES = previous
  })

  const returns = asObject({ ok: asString })

  /** A route spec with just the fields `checkResponse` reads. */
  const spec = (withReturns = true): RouteSpec<any, any, any> =>
    ({
      method: 'GET',
      path: '/engine/status',
      ...(withReturns ? { returns } : {})
    } as unknown as RouteSpec<any, any, any>)

  /** A context with just the logger `checkResponse` reads. */
  function makeCtx(): { ctx: RouteContext; warn: jest.Mock } {
    const warn = jest.fn()
    return {
      ctx: { state: { logger: { warn } } } as unknown as RouteContext,
      warn: warn as unknown as jest.Mock
    }
  }

  it('warns and passes the body through by default', () => {
    delete process.env.EDGE_CLI_CHECK_RESPONSES
    const { ctx, warn } = makeCtx()
    // A mismatch is a documentation bug, never the caller's fault, so the
    // default must not fail a request that would otherwise have worked.
    expect(() => {
      checkResponse(spec(), ctx, { ok: 1 })
    }).not.toThrow()
    expect(warn).toHaveBeenCalledTimes(1)
    expect(warn.mock.calls[0][0]).toBe('Response type mismatch')
    expect(warn.mock.calls[0][1]).toMatchObject({
      route: 'GET /engine/status'
    })
  })

  it('does not warn when the response matches', () => {
    delete process.env.EDGE_CLI_CHECK_RESPONSES
    const { ctx, warn } = makeCtx()
    checkResponse(spec(), ctx, { ok: 'yes' })
    expect(warn).not.toHaveBeenCalled()
  })

  it('turns drift into a 500 under strict', () => {
    process.env.EDGE_CLI_CHECK_RESPONSES = 'strict'
    const { ctx, warn } = makeCtx()
    let code: string | undefined
    let status: number | undefined
    try {
      checkResponse(spec(), ctx, { ok: 1 })
    } catch (error: unknown) {
      const engineError = error as { code: string; status: number }
      code = engineError.code
      status = engineError.status
    }
    // The mode the offline suites run in: a shape that drifts from the
    // reference fails the suite rather than being logged where nobody looks.
    expect(code).toBe('INTERNAL_ERROR')
    expect(status).toBe(500)
    expect(warn).not.toHaveBeenCalled()
  })

  it('reads 1 as strict and 0 as off', () => {
    const { ctx, warn } = makeCtx()
    process.env.EDGE_CLI_CHECK_RESPONSES = '1'
    expect(() => {
      checkResponse(spec(), ctx, { ok: 1 })
    }).toThrow()
    process.env.EDGE_CLI_CHECK_RESPONSES = '0'
    expect(() => {
      checkResponse(spec(), ctx, { ok: 1 })
    }).not.toThrow()
    expect(warn).not.toHaveBeenCalled()
  })

  it('never runs the cleaner when off', () => {
    process.env.EDGE_CLI_CHECK_RESPONSES = 'off'
    const { ctx, warn } = makeCtx()
    const cleaner = jest.fn(asNumber)
    const offSpec = {
      method: 'GET',
      path: '/engine/status',
      returns: cleaner
    } as unknown as RouteSpec<any, any, any>
    checkResponse(offSpec, ctx, { ok: 1 })
    expect(cleaner).not.toHaveBeenCalled()
    expect(warn).not.toHaveBeenCalled()
  })

  it('does nothing for a route that documents no shape', () => {
    delete process.env.EDGE_CLI_CHECK_RESPONSES
    const { ctx, warn } = makeCtx()
    // A 204 route has no `returns`, so there is nothing to compare against.
    expect(() => {
      checkResponse(spec(false), ctx, undefined)
    }).not.toThrow()
    expect(warn).not.toHaveBeenCalled()
  })
})
