import { describe, expect, it, jest } from '@jest/globals'
import type { EdgeCurrencyWallet, EdgeTransaction } from 'edge-core-js'

import { fillTxsFiat, toIsoFiatCode } from '../util/fillTxsFiat'

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
  )
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
