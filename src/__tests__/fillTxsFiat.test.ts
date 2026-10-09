import { describe, expect, it, jest } from '@jest/globals'
import type { EdgeCurrencyWallet, EdgeTransaction } from 'edge-core-js'

import { getHistoricalCryptoRate } from '../util/exchangeRates'
import { toIsoFiatCode } from '../util/fiatCode'
import { fillTxsFiat } from '../util/fillTxsFiat'

/**
 * Records how many lookups are outstanding at once.
 *
 * The point of the change this suite covers is that every rate is queued
 * *before* anything is awaited, so one `doQuery` cycle drains a whole page
 * instead of one cycle per ten transactions — roughly 1.1s against 120s for
 * 1,200 transactions, which is past the client's own socket timeout. Without
 * measuring concurrency, the old chunked loop and the new one produce
 * byte-identical results under a mock, so the shape could regress silently.
 */
const concurrency = { current: 0, peak: 0 }

jest.mock('../util/exchangeRates', () => ({
  getHistoricalCryptoRate: jest.fn(
    async (_pluginId: string, _tokenId: unknown, isoFiat: string) => {
      concurrency.current++
      if (concurrency.current > concurrency.peak) {
        concurrency.peak = concurrency.current
      }
      // A microtask boundary, not a timer: `jestSetup` installs fake timers
      // globally, so a `setTimeout` here would never fire. Every caller
      // queued before the first await has incremented by the time this
      // resumes.
      await Promise.resolve()
      concurrency.current--
      if (isoFiat === 'iso:EUR') return 40000
      return 50000
    }
  ),
  // The real predicate, not a stub: `fillTxsFiat` uses it to tell the
  // queue's "gave up" answer from the `0` the server gives for a date it
  // cannot price, and a mock module that leaves it out makes every lookup
  // throw inside the `.then`.
  isRateUnavailable: (rate: number) => !Number.isFinite(rate)
}))

function makeWallet(): EdgeCurrencyWallet {
  // Incomplete core wallet — fillTxsFiat only reads currencyInfo and
  // currencyConfig, so the cast says what the shape really is.
  const wallet = {
    currencyInfo: { pluginId: 'bitcoin' },
    currencyConfig: {
      currencyInfo: {
        pluginId: 'bitcoin',
        denominations: [{ name: 'BTC', multiplier: '100000000', symbol: '₿' }]
      },
      allTokens: {}
    }
  }
  return wallet as unknown as EdgeCurrencyWallet
}

function makeTx(overrides: Partial<EdgeTransaction> = {}): EdgeTransaction {
  const tx: EdgeTransaction = {
    blockHeight: 1,
    currencyCode: 'BTC',
    date: 1700000000,
    deviceDescription: 'test',
    isSend: false,
    memos: [],
    nativeAmount: '100000000',
    networkFee: '0',
    networkFees: [],
    ourReceiveAddresses: [],
    parentNetworkFee: '0',
    signedTx: '',
    tokenId: null,
    txid: 'txid',
    walletId: '',
    ...overrides
  }
  return tx
}

describe('fillTxsFiat', () => {
  it('fills missing isoFiat from the historical rate', async () => {
    const tx = makeTx({ metadata: { name: 'Keep me' } })
    await fillTxsFiat({
      wallet: makeWallet(),
      tokenId: null,
      isoFiat: 'iso:USD',
      txs: [tx]
    })
    expect(tx.metadata?.name).toBe('Keep me')
    expect(tx.metadata?.exchangeAmount?.['iso:USD']).toBe(50000)
  })

  it('leaves a transaction alone when the queue gave up on it', async () => {
    // `RATE_UNAVAILABLE` is not a rate. Multiplying it in wrote `NaN`, and
    // settling the queue's give-up at `0` — which is what it used to do —
    // wrote a zero fiat amount indistinguishable from a real one into every
    // CSV, QBO and Bitwave file built from the page. The count is what
    // `get-transactions` refuses an export on.
    const mocked: any = getHistoricalCryptoRate
    mocked.mockImplementationOnce(async () => Number.NaN)
    const tx = makeTx({ nativeAmount: '100000000', metadata: undefined })
    const result = await fillTxsFiat({
      wallet: makeWallet(),
      tokenId: null,
      isoFiat: 'iso:USD',
      txs: [tx]
    })
    expect(result).toStrictEqual({ asked: 1, unavailable: 1 })
    expect(tx.metadata?.exchangeAmount?.['iso:USD']).toBeUndefined()
  })

  it('reports nothing unavailable when every date was priced', async () => {
    const result = await fillTxsFiat({
      wallet: makeWallet(),
      tokenId: null,
      isoFiat: 'iso:USD',
      txs: [makeTx({ metadata: undefined }), makeTx({ metadata: undefined })]
    })
    expect(result).toStrictEqual({ asked: 2, unavailable: 0 })
  })

  it('skips txs that already have a non-zero amount for that fiat', async () => {
    const tx = makeTx({
      metadata: { exchangeAmount: { 'iso:USD': 12.5 } }
    })
    await fillTxsFiat({
      wallet: makeWallet(),
      tokenId: null,
      isoFiat: 'iso:USD',
      txs: [tx]
    })
    expect(tx.metadata?.exchangeAmount?.['iso:USD']).toBe(12.5)
  })

  it('fills an override fiat without dropping other stored amounts', async () => {
    const tx = makeTx({
      metadata: { exchangeAmount: { 'iso:USD': 12.5 } }
    })
    await fillTxsFiat({
      wallet: makeWallet(),
      tokenId: null,
      isoFiat: 'iso:EUR',
      txs: [tx]
    })
    expect(tx.metadata?.exchangeAmount?.['iso:USD']).toBe(12.5)
    expect(tx.metadata?.exchangeAmount?.['iso:EUR']).toBe(40000)
  })
})

describe('toIsoFiatCode', () => {
  it('accepts a 3-letter code, optional iso: prefix, and any case', () => {
    expect(toIsoFiatCode('USD')).toBe('iso:USD')
    expect(toIsoFiatCode('eur')).toBe('iso:EUR')
    expect(toIsoFiatCode('iso:GBP')).toBe('iso:GBP')
    expect(toIsoFiatCode('  cad ')).toBe('iso:CAD')
  })

  it('rejects non-fiat codes', () => {
    expect(toIsoFiatCode('')).toBeUndefined()
    expect(toIsoFiatCode('US')).toBeUndefined()
    expect(toIsoFiatCode('USDT')).toBeUndefined()
    expect(toIsoFiatCode('123')).toBeUndefined()
  })
})

describe('fillTxsFiat concurrency', () => {
  it('queues every rate before awaiting any of them', async () => {
    concurrency.current = 0
    concurrency.peak = 0
    const txs = Array.from({ length: 25 }, (_unused, i) =>
      makeTx({ txid: `tx${i}`, date: 1700000000 + i * 86_400 })
    )
    await fillTxsFiat({
      wallet: makeWallet(),
      tokenId: null,
      isoFiat: 'iso:USD',
      txs
    })
    // 25, not 10: the chunked loop awaited ten at a time, and each chunk
    // paid its own debounce.
    expect(concurrency.peak).toBe(25)
  })
})
