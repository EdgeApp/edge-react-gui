import { describe, expect, it } from '@jest/globals'

import type {
  RampQuote,
  RampQuoteRequest
} from '../../../plugins/ramps/rampPluginTypes'
import { isRampQuoteUnfunded } from '../../../plugins/ramps/utils/rampQuoteUnfunded'

const wallet: any = {
  balanceMap: new Map([[null, '100000000']]),
  currencyConfig: {
    allTokens: {},
    currencyInfo: {
      currencyCode: 'BTC',
      denominations: [{ name: 'BTC', multiplier: '100000000' }]
    }
  },
  currencyInfo: {
    currencyCode: 'BTC',
    denominations: [{ name: 'BTC', multiplier: '100000000' }]
  }
}

const makeRequest = (
  overrides: Partial<RampQuoteRequest> = {}
): RampQuoteRequest =>
  ({
    amountQuery: { exchangeAmount: '2' },
    direction: 'sell',
    tokenId: null,
    wallet,
    ...overrides
  } as any)

const makeQuote = (cryptoAmount: string, fiatAmount = '100'): RampQuote =>
  ({ cryptoAmount, fiatAmount } as any)

describe('isRampQuoteUnfunded', () => {
  it('flags a sell quote above the balance', () => {
    expect(isRampQuoteUnfunded(makeQuote('1.5'), makeRequest())).toBe(true)
  })

  it('passes a sell quote at or below the balance', () => {
    expect(isRampQuoteUnfunded(makeQuote('1'), makeRequest())).toBe(false)
    expect(isRampQuoteUnfunded(makeQuote('0.5'), makeRequest())).toBe(false)
  })

  it('ignores buy quotes', () => {
    const request = makeRequest({ direction: 'buy' })
    expect(isRampQuoteUnfunded(makeQuote('1.5'), request)).toBe(false)
  })

  it('ignores max sells', () => {
    const request = makeRequest({ amountQuery: { max: true } as any })
    expect(isRampQuoteUnfunded(makeQuote('1.5'), request)).toBe(false)
  })

  it('ignores quotes without amounts', () => {
    expect(isRampQuoteUnfunded(makeQuote('0', '0'), makeRequest())).toBe(false)
  })
})
