import { describe, expect, test } from '@jest/globals'

import {
  asPhazeCreateOrderResponse,
  asPhazeOrderStatusItem
} from '../plugins/gift-cards/phazeGiftCardTypes'

const order = {
  externalUserId: 'user-1',
  quoteId: 'quote-1',
  status: 'pending',
  deliveryAddress: 'bc1qexample',
  tokenIdentifier: 'bip122:000000000019d6689c085ae165831e93/slip44:0',
  quantity: 0.001,
  amountInUSD: 50,
  receivedQuantity: 0,
  cart: []
}

describe('Phaze order quoteExpiry', () => {
  test('create order response accepts a missing quoteExpiry', () => {
    expect(asPhazeCreateOrderResponse(order).quoteExpiry).toBeUndefined()
  })

  test('order status item accepts a missing quoteExpiry', () => {
    expect(asPhazeOrderStatusItem(order).quoteExpiry).toBeUndefined()
  })

  test('numeric string quoteExpiry still parses as a number', () => {
    expect(
      asPhazeCreateOrderResponse({ ...order, quoteExpiry: '1789600000000' })
        .quoteExpiry
    ).toBe(1789600000000)
  })
})
