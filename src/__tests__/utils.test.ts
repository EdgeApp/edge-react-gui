import { describe, expect, test } from '@jest/globals'
import { log10 } from 'biggystring'

import { sanitizeDecimalAmount } from '../components/themed/FlipInput'
import { getDenominationFromCurrencyInfo, getDisplayDenomination } from '../selectors/DenominationSelectors'
import {
  convertNativeToDenomination,
  convertNativeToDisplay,
  convertNativeToExchange,
  daysBetween,
  getNewArrayWithItem,
  getSupportedFiats,
  isValidInput,
  maxPrimaryCurrencyConversionDecimals,
  MILLISECONDS_PER_DAY,
  precisionAdjust,
  roundedFee,
  roundUpToLeastSignificant,
  truncateDecimals,
  zerosAfterDecimal
} from '../util/utils'

describe('isValidInput', function () {
  describe('when input is valid', function () {
    test('1 => true', function () {
      const validInput = '1'
      const expected = true
      const actual = isValidInput(validInput)
      expect(actual).toBe(expected)
    })

    test('. => true', function () {
      const validInput = '.'
      const expected = true
      const actual = isValidInput(validInput)
      expect(actual).toBe(expected)
    })

    test('.0 => true', function () {
      const validInput = '.'
      const expected = true
      const actual = isValidInput(validInput)
      expect(actual).toBe(expected)
    })

    test('0.0 => true', function () {
      const validInput = '.'
      const expected = true
      const actual = isValidInput(validInput)
      expect(actual).toBe(expected)
    })

    test('0.01 => true', function () {
      const validInput = '.'
      const expected = true
      const actual = isValidInput(validInput)
      expect(actual).toBe(expected)
    })

    test('0 => true', function () {
      const validInput = '.'
      const expected = true
      const actual = isValidInput(validInput)
      expect(actual).toBe(expected)
    })
  })

  describe('when input is invalid', function () {
    test('R => false', function () {
      const invalidInput = 'R'
      const expected = false
      const actual = isValidInput(invalidInput)
      expect(actual).toBe(expected)
    })

    test('0R => false', function () {
      const invalidInput = '0R'
      const expected = false
      const actual = isValidInput(invalidInput)
      expect(actual).toBe(expected)
    })

    test('0.R => false', function () {
      const invalidInput = '0.R'
      const expected = false
      const actual = isValidInput(invalidInput)
      expect(actual).toBe(expected)
    })

    test('0.0. => false', function () {
      const invalidInput = '0.0.'
      const expected = false
      const actual = isValidInput(invalidInput)
      expect(actual).toBe(expected)
    })

    test('0.123q => false', function () {
      const invalidInput = '0.123q'
      const expected = false
      const actual = isValidInput(invalidInput)
      expect(actual).toBe(expected)
    })
  })
})

describe('convertNativeToDenomination', function () {
  test('100000000 => 1', function () {
    const nativeToDisplayRatio = '100000000'
    const nativeAmount = '100000000'
    const expected = '1'
    const actual = convertNativeToDenomination(nativeToDisplayRatio)(nativeAmount)
    expect(actual).toBe(expected)
  })
})

describe('convertNativeToDisplay', function () {
  test('100000000 => 1', function () {
    const nativeToDisplayRatio = '100000000'
    const nativeAmount = '100000000'
    const expected = '1'
    const actual = convertNativeToDisplay(nativeToDisplayRatio)(nativeAmount)
    expect(actual).toBe(expected)
  })
})

describe('convertNativeToExchange', function () {
  test('100000000 => 1', function () {
    const nativeToDisplayRatio = '100000000'
    const nativeAmount = '100000000'
    const expected = '1'
    const actual = convertNativeToExchange(nativeToDisplayRatio)(nativeAmount)
    expect(actual).toBe(expected)
  })
})

describe('truncateDecimals', function () {
  test('1 => 1', function () {
    const input = '1'
    const precision = 0
    const expected = '1'
    const actual = truncateDecimals(input, precision)
    expect(actual).toBe(expected)
  })

  test('1 => 1', function () {
    const input = '1'
    const precision = 8
    const expected = '1'
    const actual = truncateDecimals(input, precision)
    expect(actual).toBe(expected)
  })

  test('1.0 => 1', function () {
    const input = '1.0'
    const precision = 1
    const expected = '1.0'
    const actual = truncateDecimals(input, precision)
    expect(actual).toBe(expected)
  })

  test('1.123456789 => 1.0', function () {
    const input = '1.123456789'
    const precision = 1
    const expected = '1.1'
    const actual = truncateDecimals(input, precision)
    expect(actual).toBe(expected)
  })

  test('1.19 => 1.0', function () {
    const input = '1.19'
    const precision = 1
    const expected = '1.1'
    const actual = truncateDecimals(input, precision)
    expect(actual).toBe(expected)
  })

  test('1.123456789 to 0 => 1', function () {
    const input = '1.123456789'
    const precision = 0
    const expected = '1'
    const actual = truncateDecimals(input, precision)
    expect(actual).toBe(expected)
  })
})

describe('getNewArrayWithItem', function () {
  describe('returns new array', function () {
    test('input !== output', function () {
      const array = [1, 2, 3]
      const input = 4
      const expected = array
      const actual = getNewArrayWithItem(array, input)
      expect(actual).not.toBe(expected)
    })
  })

  describe('when array includes item', function () {
    test('[1, 2, 3] => [1, 2, 3]', function () {
      const array = [1, 2, 3]
      const input = 1
      const expected = [1, 2, 3]
      const actual = getNewArrayWithItem(array, input)
      expect(actual).toEqual(expected)
    })
  })

  describe('when array does not include item', function () {
    test('[1, 2, 3] => [1, 2, 3, 4]', function () {
      const array = [1, 2, 3]
      const input = 4
      const expected = [1, 2, 3, 4]
      const actual = getNewArrayWithItem(array, input)
      expect(actual).toEqual(expected)
    })
  })
})

describe('getSupportedFiats', function () {
  test('resolves to array of object {value, label}', function () {
    const supportedFiats = getSupportedFiats()
    supportedFiats.forEach(fiat => {
      expect(fiat).toEqual(expect.objectContaining({ label: expect.any(String), value: expect.any(String) }))
    })
  })
})

describe('daysBetween', () => {
  test('1 day', () => {
    const start = 0
    const end = 1
    const days = end - start
    const a = new Date(MILLISECONDS_PER_DAY * start)
    const b = new Date(MILLISECONDS_PER_DAY * end)
    expect(daysBetween(a.valueOf(), b.valueOf())).toEqual(days)
  })

  test('5 days', () => {
    const start = 0
    const end = 5
    const days = end - start
    const a = MILLISECONDS_PER_DAY * start
    const b = MILLISECONDS_PER_DAY * end
    expect(daysBetween(a, b)).toEqual(days)
  })

  test('15.75 days', () => {
    const start = 10
    const end = 25.75
    const days = end - start
    const a = MILLISECONDS_PER_DAY * start
    const b = MILLISECONDS_PER_DAY * end
    expect(daysBetween(a, b)).toEqual(days)
  })
})

describe('Sanitize Decimal Amount', function () {
  const maxEntryDecimals = 2
  test('Replace all commas into periods', function () {
    const input = ','
    const expected = '.'
    expect(sanitizeDecimalAmount(input, maxEntryDecimals)).toBe(expected)
  })
  test('Remove characters except numbers and decimal separator', function () {
    const input = 'qwertyuiopasdfghjklzxcvbnm1234567890,.'
    const expected = '1234567890.'
    expect(sanitizeDecimalAmount(input, maxEntryDecimals)).toBe(expected)
  })

  test('Trunctuate Decimals', function () {
    const input = '.13213'
    const expected = '.13'
    expect(sanitizeDecimalAmount(input, maxEntryDecimals)).toBe(expected)
  })

  test('Remove additional decimal separator', function () {
    const input = '123.456.789'
    const expected = '123.45'
    expect(sanitizeDecimalAmount(input, maxEntryDecimals)).toBe(expected)
  })
})

describe('precisionAdjust', function () {
  const tests = {
    'BTC for precision adjustment and max conversion decimal': {
      input: {
        displayDenominationMultiplier: '100000000',
        primaryExchangeMultiplier: '100000000',
        secondaryExchangeMultiplier: '100',
        exchangeSecondaryToPrimaryRatio: 32533.217120011082
      },
      output: {
        precisionAdjustmentValue: 0,
        maxPrimaryCurrencyConversionDecimals: 8
      }
    },
    'ETH for precision adjustment and max conversion decimal': {
      input: {
        displayDenominationMultiplier: '1000000000000000000',
        primaryExchangeMultiplier: '1000000000000000000',
        secondaryExchangeMultiplier: '100',
        exchangeSecondaryToPrimaryRatio: 1359.8708229894155
      },
      output: {
        precisionAdjustmentValue: 11,
        maxPrimaryCurrencyConversionDecimals: 7
      }
    }
  }

  for (const key in tests) {
    // @ts-expect-error
    const { input, output } = tests[key]
    const { displayDenominationMultiplier, primaryExchangeMultiplier, secondaryExchangeMultiplier, exchangeSecondaryToPrimaryRatio } = input

    test(key, function () {
      const precisionAdjustmentValue = precisionAdjust({ primaryExchangeMultiplier, secondaryExchangeMultiplier, exchangeSecondaryToPrimaryRatio })
      expect(precisionAdjustmentValue).toBe(output.precisionAdjustmentValue)
      expect(maxPrimaryCurrencyConversionDecimals(log10(displayDenominationMultiplier), precisionAdjustmentValue)).toBe(
        output.maxPrimaryCurrencyConversionDecimals
      )
    })
  }
})

describe('getDisplayDenomination', function () {
  const tests = {
    title: 'Display Denomination of',
    input: [
      {
        pluginId: 'bitcoin',
        currencyCode: 'BTC'
      },
      {
        pluginId: 'ethereum',
        currencyCode: 'ETH'
      },
      {
        pluginId: 'ethereum',
        currencyCode: 'TKN'
      }
    ],
    output: [
      {
        multiplier: '1',
        name: 'sats',
        symbol: 's'
      },
      {
        multiplier: '1000000000000000',
        name: 'mETH',
        symbol: 'mΞ'
      },
      {
        multiplier: '10000000000000000000000000000000000000000000000000',
        name: 'TKN'
      }
    ]
  }
  const { title, input, output } = tests

  const state = {
    ui: {
      settings: {
        denominationSettings: {
          bitcoin: {
            BTC: {
              multiplier: '1',
              name: 'sats',
              symbol: 's'
            }
          },
          ethereum: {
            ETH: {
              multiplier: '1000000000000000',
              name: 'mETH',
              symbol: 'mΞ'
            }
          }
        },
        customTokens: []
      }
    },
    core: {
      account: {
        currencyConfig: {
          ethereum: {
            allTokens: {
              '1985365e9f78359a9B6AD760e32412f4a445E862': {
                currencyCode: 'TKN',
                displayName: 'Token',
                denominations: [
                  {
                    name: 'TKN',
                    multiplier: '10000000000000000000000000000000000000000000000000'
                  }
                ],
                contractAddress: '0x1985365e9f78359a9B6AD760e32412f4a445E862'
              }
            },
            currencyInfo: {
              currencyCode: 'ETH',
              pluginId: 'ethereum',
              denominations: [
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
              ],
              metaTokens: [
                {
                  currencyCode: 'TKN',
                  currencyName: 'Token',
                  denominations: [
                    {
                      name: 'TKN',
                      multiplier: '10000000000000000000000000000000000000000000000000'
                    }
                  ],
                  contractAddress: '0x1985365e9f78359a9B6AD760e32412f4a445E862'
                }
              ]
            }
          }
        }
      }
    }
  }

  input.forEach((currency, index) => {
    test(`${title} ${currency.currencyCode}`, function () {
      // @ts-expect-error
      expect(getDisplayDenomination(state, currency.pluginId, currency.currencyCode)).toMatchObject(output[index])
    })
  })
})

describe('getExchangeDenomination', function () {
  const tests = {
    title: 'Exchange Denomination of',
    input: ['BTC', 'ETH', 'TKN'],
    output: [
      {
        multiplier: '100000000',
        name: 'BTC',
        symbol: '₿'
      },
      {
        multiplier: '1000000000000000000',
        name: 'ETH',
        symbol: 'Ξ'
      },
      {
        multiplier: '10000000000000000000000000000000000000000000000000',
        name: 'TKN'
      }
    ]
  }
  const { title, input, output } = tests

  const currencyInfos = {
    BTC: {
      currencyCode: 'BTC',
      pluginId: 'bitcoin',
      denominations: [
        { name: 'BTC', multiplier: '100000000', symbol: '₿' },
        { name: 'mBTC', multiplier: '100000', symbol: 'm₿' },
        { name: 'bits', multiplier: '100', symbol: 'ƀ' },
        { name: 'sats', multiplier: '1', symbol: 's' }
      ],
      metaTokens: []
    },
    ETH: {
      currencyCode: 'ETH',
      pluginId: 'ethereum',
      denominations: [
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
      ],
      metaTokens: [
        {
          currencyCode: 'TKN',
          currencyName: 'Augur',
          denominations: [
            {
              name: 'TKN',
              multiplier: '10000000000000000000000000000000000000000000000000'
            }
          ],
          contractAddress: '0x1985365e9f78359a9B6AD760e32412f4a445E862'
        }
      ]
    }
  }

  input.forEach((currency, index) => {
    test(`${title} ${currency}`, function () {
      // @ts-expect-error
      const currencyInfo = currencyInfos[currency] ?? currencyInfos.ETH
      expect(getDenominationFromCurrencyInfo(currencyInfo, currency)).toMatchObject(output[index])
    })
  })
})

describe('zerosAfterDecimal', function () {
  const tests = {
    title: 'Zeros after decimal place of',
    input: ['0.00036270', '128372', '12392.0123', '123.456'],
    output: [3, 0, 1, 0]
  }
  const { title, input, output } = tests

  input.forEach((amount, index) => {
    test(`${title} ${amount}`, function () {
      expect(zerosAfterDecimal(amount)).toBe(output[index])
    })
  })
})

describe('roundUpToLeastSignificant', function () {
  const tests = {
    title: 'Rounded up to least significant digit of',
    input: ['123.4567', '0.0001239', '123'],
    output: ['123.4568', '0.000124', '123']
  }
  const { title, input, output } = tests

  input.forEach((amount, index) => {
    test(`${title} ${amount}`, function () {
      expect(roundUpToLeastSignificant(amount)).toBe(output[index])
    })
  })
})

describe('roundedFee', function () {
  const tests = {
    title: 'Truncate and rounded up to least significant digit of',
    input: [
      {
        amount: '1234567',
        decimalPlacesBeyondLeadingZeros: 2,
        multiplier: '1000000000000'
      },
      {
        amount: '548735948753',
        decimalPlacesBeyondLeadingZeros: 4,
        multiplier: '1000'
      },
      {
        amount: '92837289000037373',
        decimalPlacesBeyondLeadingZeros: 1,
        multiplier: '1000000000000000000'
      },
      {
        amount: '',
        decimalPlacesBeyondLeadingZeros: 12,
        multiplier: '1000000000'
      }
    ],
    output: ['0.0000013 ', '548735948.753 ', '0.1 ', '']
  }
  const { title, input, output } = tests

  input.forEach((obj, index) => {
    const { amount, decimalPlacesBeyondLeadingZeros, multiplier } = obj
    test(`${title} ${amount}`, function () {
      expect(roundedFee(amount, decimalPlacesBeyondLeadingZeros, multiplier)).toBe(output[index])
    })
  })
})
