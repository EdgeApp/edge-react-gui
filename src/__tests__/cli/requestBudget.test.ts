import { describe, expect, it } from '@jest/globals'
import type { IncomingMessage } from 'http'

import {
  readRequestBudgetMs,
  REQUEST_BUDGET_HEADER
} from '../../cli/requestBudget'

/**
 * The one header the client sends that no route declares.
 *
 * `--timeout` moved `apiClient`'s own deadline and nothing else, so on the
 * one route whose work has an internal budget — `get-transactions`'s
 * historical fiat fill, whose chain *settles* the remainder when its budget
 * expires — the control the CLI offers for "slow is better than wrong" had
 * no effect on the work it was waiting for.
 *
 * Every rejected spelling falls back to the module constant rather than to
 * the value in the header, because a budget of `0` or an overflowed timer
 * would make the fill give up *instantly* — the opposite of what a caller
 * raising a timeout is asking for, and the same 32-bit trap
 * `asMinSeconds` refuses above.
 */
const req = (value?: string | string[]): IncomingMessage =>
  ({
    headers: value === undefined ? {} : { [REQUEST_BUDGET_HEADER]: value }
  } as unknown as IncomingMessage)

describe('readRequestBudgetMs', () => {
  it('reads a budget the client sent', () => {
    expect(readRequestBudgetMs(req('120000'))).toBe(120000)
  })

  it('answers undefined when the caller did not say', () => {
    expect(readRequestBudgetMs(req())).toBeUndefined()
    expect(readRequestBudgetMs(req(''))).toBeUndefined()
    // A handler driven directly by a test has no request at all.
    expect(readRequestBudgetMs(undefined)).toBeUndefined()
  })

  it('ignores a value that would make the work give up at once', () => {
    expect(readRequestBudgetMs(req('0'))).toBeUndefined()
    expect(readRequestBudgetMs(req('-1'))).toBeUndefined()
    expect(readRequestBudgetMs(req('nonsense'))).toBeUndefined()
    expect(readRequestBudgetMs(req('NaN'))).toBeUndefined()
  })

  it('ignores a value past the 32-bit timer ceiling', () => {
    // `setTimeout` keeps its delay in a 32-bit signed int and clamps above
    // it to 1 ms, so this is the same trap as `--idle-timeout`.
    expect(readRequestBudgetMs(req(String(2 ** 31)))).toBeUndefined()
    expect(readRequestBudgetMs(req(String(2 ** 31 - 1)))).toBe(2 ** 31 - 1)
  })

  it('subtracts what the request has already spent', () => {
    // The header is a duration from the caller's *send*, and a route reads
    // it where its slow work starts — after the settings read, the
    // spam-floor rate query and `wallet.getTransactions`. Taken as a fresh
    // budget there, the engine's inner deadline was always later than the
    // caller's outer one, so in the one case the budget exists for the
    // client had already timed out and destroyed the socket before the
    // engine settled the remainder.
    const budget = readRequestBudgetMs(req('10000'), Date.now() - 4000)
    expect(budget).toBeLessThanOrEqual(6000)
    expect(budget).toBeGreaterThan(5500)
  })

  it('falls back to the default when the caller’s deadline is spent', () => {
    // Not `0` and not a negative: a budget that makes the work give up
    // instantly is the failure every other rejected spelling here avoids.
    expect(readRequestBudgetMs(req('1000'), Date.now() - 5000)).toBeUndefined()
  })

  it('ignores the arrival stamp when there is no header', () => {
    expect(readRequestBudgetMs(req(), Date.now() - 10)).toBeUndefined()
  })

  it('takes the first of a repeated header, and floors it', () => {
    expect(readRequestBudgetMs(req(['5000', '1']))).toBe(5000)
    expect(readRequestBudgetMs(req('5000.9'))).toBe(5000)
  })
})
