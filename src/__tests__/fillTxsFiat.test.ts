import { describe, expect, it, jest } from '@jest/globals'
import type { EdgeCurrencyWallet, EdgeTransaction } from 'edge-core-js'

import { fillTxsFiat, toIsoFiatCode } from '../util/fillTxsFiat'

jest.mock('../util/exchangeRates', () => ({
  getHistoricalCryptoRate: jest.fn(
    async (_pluginId: string, _tokenId: unknown, isoFiat: string) => {
      if (isoFiat === 'iso:EUR') return 40000
      return 50000
    }
  )
}))

function makeWallet(): EdgeCurrencyWallet {
  // Incomplete core wallet — fillTxsFiat only reads currencyInfo/currencyConfig.
  const wallet: EdgeCurrencyWallet = {
    currencyInfo: { pluginId: 'bitcoin' },
    currencyConfig: {
      currencyInfo: {
        pluginId: 'bitcoin',
        denominations: [{ name: 'BTC', multiplier: '100000000', symbol: '₿' }]
      },
      allTokens: {}
    }
  }
  return wallet
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
