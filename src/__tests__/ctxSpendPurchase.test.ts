import { describe, expect, test } from '@jest/globals'
import type { EdgeCurrencyWallet } from 'edge-core-js'

import {
  getCtxPaymentNativeAmount,
  getCtxPaymentPluginId,
  isCtxGiftCardFailed,
  isCtxGiftCardFulfilled,
  isCtxGiftCardPaid,
  isCtxGiftCardTerminal,
  isCtxNativePayment
} from '../plugins/gift-cards/ctxSpendPurchase'
import type { CtxSpendGiftCard } from '../plugins/gift-cards/ctxSpendTypes'

// A card as `POST /gift-cards` actually returns it, trimmed to the fields
// these helpers read.
const makeCard = (
  overrides: Partial<CtxSpendGiftCard> = {}
): CtxSpendGiftCard => {
  const card: CtxSpendGiftCard = {
    id: '2adf8f1c-4885-44e4-a17b-8ae35b9a1bc5',
    merchantId: '7c8bf315-703f-4b6c-972d-574411c059e9',
    merchantName: 'Amazon',
    cardFiatAmount: '0.01',
    cardFiatCurrency: 'USD',
    paymentId: '99df9dd3-985f-4fa2-a82e-6074222f92cd',
    paymentMethod: 'crypto',
    paymentCryptoAddress: '0x67587B625a63a1E692eb7D73Dc11d57Ff3597406',
    paymentCryptoAmount: '0.000005200000000000',
    paymentCryptoChain: 'ETH',
    paymentCryptoCurrency: 'ETH',
    paymentCryptoNetwork: 'testnet',
    paymentUrls: {},
    rate: '1923.0769',
    status: 'unpaid',
    displayStatus: 'unpaid',
    paymentStatus: 'unpaid',
    fulfilmentStatus: 'pending',
    // Absent until the card is fulfilled, which is when CTX issues them.
    redeemUrl: undefined,
    barcodeUrl: undefined,
    created: '2026-08-17T19:53:14Z',
    updated: '2026-08-17T19:53:14Z'
  }
  return { ...card, ...overrides }
}

const makeWallet = (multiplier: string): EdgeCurrencyWallet =>
  ({
    currencyInfo: { denominations: [{ multiplier }] }
  } as unknown as EdgeCurrencyWallet)

describe('getCtxPaymentPluginId', () => {
  test('maps a testnet ETH quote to sepolia, the only testnet Edge carries', () => {
    expect(getCtxPaymentPluginId(makeCard())).toBe('sepolia')
  })

  test('maps a mainnet ETH quote to ethereum', () => {
    expect(
      getCtxPaymentPluginId(makeCard({ paymentCryptoNetwork: 'mainnet' }))
    ).toBe('ethereum')
  })

  test('returns undefined for chains Edge has no wallet type for', () => {
    // Staging quotes these happily; the app still cannot pay them.
    for (const chain of ['XMR', 'ZEC', 'ZANO', 'DASH', 'XLM', 'LTC', 'BCH']) {
      expect(
        getCtxPaymentPluginId(makeCard({ paymentCryptoChain: chain }))
      ).toBeUndefined()
    }
  })

  test('returns undefined when the quote names no chain or network', () => {
    expect(
      getCtxPaymentPluginId(makeCard({ paymentCryptoChain: undefined }))
    ).toBeUndefined()
    expect(
      getCtxPaymentPluginId(makeCard({ paymentCryptoNetwork: undefined }))
    ).toBeUndefined()
  })

  test('maps every mainnet chain CTX quotes to its Edge plugin', () => {
    // Chain codes read back from a live `POST /gift-cards` per currency, not
    // taken from a currency list.
    const expected: Record<string, string> = {
      BCH: 'bitcoincash',
      BTC: 'bitcoin',
      DASH: 'dash',
      ETH: 'ethereum',
      LTC: 'litecoin',
      XLM: 'stellar',
      XMR: 'monero',
      ZANO: 'zano',
      ZEC: 'zcash'
    }
    for (const [chain, pluginId] of Object.entries(expected)) {
      const card = makeCard({
        paymentCryptoChain: chain,
        paymentCryptoNetwork: 'mainnet'
      })
      expect(getCtxPaymentPluginId(card)).toBe(pluginId)
    }
  })
})

describe('isCtxNativePayment', () => {
  test('a plain chain quote is native', () => {
    expect(isCtxNativePayment(makeCard())).toBe(true)
  })

  test('rejects a token quote, which would otherwise overpay in the native asset', () => {
    // Live staging shape: chain stays ETH while the currency names the token.
    // The wallet lookup and the wei conversion both key off the chain, so a
    // 0.01 USDC quote reaching them would send 0.01 ETH.
    const card = makeCard({
      paymentCryptoChain: 'ETH',
      paymentCryptoCurrency: 'ETH.USDC',
      paymentCryptoAmount: '0.010000'
    })
    expect(isCtxNativePayment(card)).toBe(false)
  })

  test('a quote missing either half is not native', () => {
    expect(
      isCtxNativePayment(makeCard({ paymentCryptoCurrency: undefined }))
    ).toBe(false)
    expect(
      isCtxNativePayment(makeCard({ paymentCryptoChain: undefined }))
    ).toBe(false)
  })
})

describe('getCtxPaymentNativeAmount', () => {
  test('converts the quote to wei exactly', () => {
    // The payment URI for this same card carries value=5200000000000.
    expect(
      getCtxPaymentNativeAmount(makeCard(), makeWallet('1000000000000000000'))
    ).toBe('5200000000000')
  })

  test('never rounds down, since an underpayment leaves the card unpaid', () => {
    // A quote finer than the chain's smallest unit must round up.
    const card = makeCard({ paymentCryptoAmount: '0.000000015' })
    expect(getCtxPaymentNativeAmount(card, makeWallet('100000000'))).toBe('2')
  })

  test('throws when the card carries no payment amount', () => {
    expect(() =>
      getCtxPaymentNativeAmount(
        makeCard({ paymentCryptoAmount: undefined }),
        makeWallet('1000000000000000000')
      )
    ).toThrow()
  })
})

describe('isCtxGiftCardPaid', () => {
  test('a fresh order is not paid', () => {
    expect(isCtxGiftCardPaid(makeCard())).toBe(false)
    expect(isCtxGiftCardPaid(makeCard({ paymentStatus: 'pending' }))).toBe(
      false
    )
  })

  test('recognises the paid state staging actually reports', () => {
    // Observed live: `unpaid` becomes `paid` once the send confirms.
    expect(isCtxGiftCardPaid(makeCard({ paymentStatus: 'paid' }))).toBe(true)
  })

  test('an in-progress fulfilment does not make it paid', () => {
    // `fulfilmentStatus` runs on its own track (`pending`, then `ordered`)
    // and says nothing about whether the payment landed.
    expect(isCtxGiftCardPaid(makeCard({ fulfilmentStatus: 'ordered' }))).toBe(
      false
    )
  })
})

// CTX's documented display-status machine: unpaid, paid, fulfilled (terminal
// success), rejected (may still move to refunded), refunded (terminal).
describe('gift card display status', () => {
  const withStatus = (displayStatus: string): CtxSpendGiftCard =>
    makeCard({ displayStatus })

  test('only `fulfilled` counts as fulfilled', () => {
    expect(isCtxGiftCardFulfilled(withStatus('fulfilled'))).toBe(true)
    for (const status of ['unpaid', 'paid', 'rejected', 'refunded']) {
      expect(isCtxGiftCardFulfilled(withStatus(status))).toBe(false)
    }
  })

  test('rejected and refunded are the failures', () => {
    expect(isCtxGiftCardFailed(withStatus('rejected'))).toBe(true)
    expect(isCtxGiftCardFailed(withStatus('refunded'))).toBe(true)
    for (const status of ['unpaid', 'paid', 'fulfilled']) {
      expect(isCtxGiftCardFailed(withStatus(status))).toBe(false)
    }
  })

  test('rejected is not terminal, because a refund can still follow', () => {
    expect(isCtxGiftCardTerminal(withStatus('rejected'))).toBe(false)
    expect(isCtxGiftCardTerminal(withStatus('fulfilled'))).toBe(true)
    expect(isCtxGiftCardTerminal(withStatus('refunded'))).toBe(true)
    for (const status of ['unpaid', 'paid']) {
      expect(isCtxGiftCardTerminal(withStatus(status))).toBe(false)
    }
  })

  test('falls back to `status` when the payload carries no display status', () => {
    const card = makeCard({ displayStatus: undefined, status: 'fulfilled' })
    expect(isCtxGiftCardFulfilled(card)).toBe(true)
    expect(isCtxGiftCardTerminal(card)).toBe(true)
  })
})
