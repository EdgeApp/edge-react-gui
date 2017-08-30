/* globals describe test expect */

import * as UTILS from '../src/modules/utils.js'

describe('convertExchangeToDisplay', function () {
  const primaryCurrencyDenominationdenominations = [
    {
      name: 'ETH',
      multiplier: '1000000000000000000',
      symbol: 'Ξ'
    },
    {
      name: 'mETH',
      multiplier: '1000000000000000',
      symbol: 'mΞ'
    }
  ]

  const secondaryCurrencyDenominationdenominations = [
    {
      name: 'USD',
      multiplier: '100',
      symbol: 'Ξ'
    }
  ]

  test('1 ETH = $ 350 => 1 mETH = $ 0.35', function () {
    const primaryCurrencyDenominationKey = '1000000000000000000'
    const secondaryCurrencyDenominationKey = '100'

    const primaryCurrencyInfo = {
      nativeAmount: '1000000000000000000',
      currencyCode: 'ETH'
    }

    const secondaryCurrencyInfo = {
      nativeAmount: '0.35',
      currencyCode: 'USD'
    }

    UTILS.convertExchangeToDisplay
    expect(actual).toBe(expected)
  })
})
