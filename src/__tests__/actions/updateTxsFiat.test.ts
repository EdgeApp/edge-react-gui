import { describe, expect, it, jest } from '@jest/globals'
import type { EdgeCurrencyWallet, EdgeTransaction } from 'edge-core-js'

import { updateTxsFiat } from '../../actions/TransactionExportActions'
import {
  RATE_CHAIN_BUDGET_MAX_MS,
  RATE_CHAIN_TIMEOUT_MS
} from '../../util/exchangeRates'

const mockFill = jest.fn(async (_opts: unknown) => ({
  asked: 0,
  unavailable: 0
}))
jest.mock('../../util/fillTxsFiat', () => ({
  fillTxsFiat: async (opts: unknown) => await mockFill(opts)
}))

/**
 * The GUI half of the scaled rate budget.
 *
 * `rateChainBudgetMs` is tabled on its own, but if this thunk stopped
 * passing it the scene would go back to the fixed 90 s, under which a
 * restored wallet's full history hit the ceiling every time — and the
 * engine passes its own deadline, so no other suite would notice.
 */
describe('updateTxsFiat', () => {
  const run = async (count: number): Promise<number | undefined> => {
    mockFill.mockClear()
    const txs = new Array(count).fill({}) as EdgeTransaction[]
    const wallet: Partial<EdgeCurrencyWallet> = {}
    const thunk = updateTxsFiat(wallet as EdgeCurrencyWallet, null, txs)
    await thunk(
      jest.fn() as any,
      (() => ({ ui: { settings: { defaultIsoFiat: 'iso:EUR' } } })) as any
    )
    const opts = mockFill.mock.calls[0][0] as {
      chainTimeoutMs?: number
      isoFiat: string
    }
    expect(opts.isoFiat).toBe('iso:EUR')
    return opts.chainTimeoutMs
  }

  it('keeps the default budget for a small fill', async () => {
    expect(await run(10)).toBe(RATE_CHAIN_TIMEOUT_MS)
  })

  it('raises it for a large one', async () => {
    const budget = await run(10_000)
    expect(budget).toBeGreaterThan(RATE_CHAIN_TIMEOUT_MS)
    expect(budget).toBe(RATE_CHAIN_BUDGET_MAX_MS)
  })
})
