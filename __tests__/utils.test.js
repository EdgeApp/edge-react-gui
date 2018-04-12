// @flow
/* globals describe test expect */

import * as UTILS from '../src/modules/utils.js'

describe('isValidInput', function () {
  describe('when input is valid', function () {
    test('1 => true', function () {
      const validInput = '1'
      const expected = true
      const actual = UTILS.isValidInput(validInput)
      expect(actual).toBe(expected)
    })

    test('. => true', function () {
      const validInput = '.'
      const expected = true
      const actual = UTILS.isValidInput(validInput)
      expect(actual).toBe(expected)
    })

    test('.0 => true', function () {
      const validInput = '.'
      const expected = true
      const actual = UTILS.isValidInput(validInput)
      expect(actual).toBe(expected)
    })

    test('0.0 => true', function () {
      const validInput = '.'
      const expected = true
      const actual = UTILS.isValidInput(validInput)
      expect(actual).toBe(expected)
    })

    test('0.01 => true', function () {
      const validInput = '.'
      const expected = true
      const actual = UTILS.isValidInput(validInput)
      expect(actual).toBe(expected)
    })

    test('0 => true', function () {
      const validInput = '.'
      const expected = true
      const actual = UTILS.isValidInput(validInput)
      expect(actual).toBe(expected)
    })
  })

  describe('when input is invalid', function () {
    test('R => false', function () {
      const invalidInput = 'R'
      const expected = false
      const actual = UTILS.isValidInput(invalidInput)
      expect(actual).toBe(expected)
    })

    test('0R => false', function () {
      const invalidInput = '0R'
      const expected = false
      const actual = UTILS.isValidInput(invalidInput)
      expect(actual).toBe(expected)
    })

    test('0.R => false', function () {
      const invalidInput = '0.R'
      const expected = false
      const actual = UTILS.isValidInput(invalidInput)
      expect(actual).toBe(expected)
    })

    test('0.0. => false', function () {
      const invalidInput = '0.0.'
      const expected = false
      const actual = UTILS.isValidInput(invalidInput)
      expect(actual).toBe(expected)
    })

    test('0.123q => false', function () {
      const invalidInput = '0.123q'
      const expected = false
      const actual = UTILS.isValidInput(invalidInput)
      expect(actual).toBe(expected)
    })
  })
})

describe('convertNativeToDenomination', function () {
  test('100000000 => 1', function () {
    const nativeToDisplayRatio = '100000000'
    const nativeAmount = '100000000'
    const expected = '1'
    const actual = UTILS.convertNativeToDenomination(nativeToDisplayRatio)(nativeAmount)
    expect(actual).toBe(expected)
  })
})

describe('convertNativeToDisplay', function () {
  test('100000000 => 1', function () {
    const nativeToDisplayRatio = '100000000'
    const nativeAmount = '100000000'
    const expected = '1'
    const actual = UTILS.convertNativeToDisplay(nativeToDisplayRatio)(nativeAmount)
    expect(actual).toBe(expected)
  })
})

describe('convertNativeToExchange', function () {
  test('100000000 => 1', function () {
    const nativeToDisplayRatio = '100000000'
    const nativeAmount = '100000000'
    const expected = '1'
    const actual = UTILS.convertNativeToExchange(nativeToDisplayRatio)(nativeAmount)
    expect(actual).toBe(expected)
  })
})

describe('convertDisplayToNative', function () {
  test('100000000 => 1', function () {
    const nativeToDisplayRatio = '100000000'
    const displayAmount = '1'
    const expected = '100000000'
    const actual = UTILS.convertDisplayToNative(nativeToDisplayRatio)(displayAmount)
    expect(actual).toBe(expected)
  })
})

describe('truncateDecimals', function () {
  test('1 => 1', function () {
    const input = '1'
    const precision = 0
    const expected = '1'
    const actual = UTILS.truncateDecimals(input, precision)
    expect(actual).toBe(expected)
  })

  test('1 => 1', function () {
    const input = '1'
    const precision = 8
    const expected = '1'
    const actual = UTILS.truncateDecimals(input, precision)
    expect(actual).toBe(expected)
  })

  test('1.0 => 1', function () {
    const input = '1.0'
    const precision = 1
    const expected = '1.0'
    const actual = UTILS.truncateDecimals(input, precision)
    expect(actual).toBe(expected)
  })

  test('1.123456789 => 1.0', function () {
    const input = '1.123456789'
    const precision = 1
    const expected = '1.1'
    const actual = UTILS.truncateDecimals(input, precision)
    expect(actual).toBe(expected)
  })

  test('1.19 => 1.0', function () {
    const input = '1.19'
    const precision = 1
    const expected = '1.1'
    const actual = UTILS.truncateDecimals(input, precision)
    expect(actual).toBe(expected)
  })

  test('1.123456789 to 0 => 1', function () {
    const input = '1.123456789'
    const precision = 0
    const expected = '1'
    const actual = UTILS.truncateDecimals(input, precision)
    expect(actual).toBe(expected)
  })
})

describe('getNewArrayWithItem', function () {
  describe('returns new array', function () {
    test('input !== output', function () {
      const array = [1, 2, 3]
      const input = 4
      const expected = array
      const actual = UTILS.getNewArrayWithItem(array, input)
      expect(actual).not.toBe(expected)
    })
  })

  describe('when array includes item', function () {
    test('[1, 2, 3] => [1, 2, 3]', function () {
      const array = [1, 2, 3]
      const input = 1
      const expected = [1, 2, 3]
      const actual = UTILS.getNewArrayWithItem(array, input)
      expect(actual).toEqual(expected)
    })
  })

  describe('when array does not include item', function () {
    test('[1, 2, 3] => [1, 2, 3, 4]', function () {
      const array = [1, 2, 3]
      const input = 4
      const expected = [1, 2, 3, 4]
      const actual = UTILS.getNewArrayWithItem(array, input)
      expect(actual).toEqual(expected)
    })
  })
})

describe('getNewArrayWithoutItem', function () {
  describe('returns new array', function () {
    test('input !== output', function () {
      const array = [1, 2, 3]
      const input = 1
      const expected = array
      const actual = UTILS.getNewArrayWithoutItem(array, input)
      expect(actual).not.toBe(expected)
    })
  })

  describe('when array includes item', function () {
    test('[1, 2, 3] => [1, 2, 3]', function () {
      const array = [1, 2, 3]
      const input = 1
      const expected = [2, 3]
      const actual = UTILS.getNewArrayWithoutItem(array, input)
      expect(actual).toEqual(expected)
    })
  })

  describe('when array does not include item', function () {
    test('[1, 2, 3] => [1, 2, 3, 4]', function () {
      const array = [1, 2, 3]
      const input = 4
      const expected = [1, 2, 3]
      const actual = UTILS.getNewArrayWithoutItem(array, input)
      expect(actual).toEqual(expected)
    })
  })
})

describe('getSupportedFiats', function () {
  test('resolves to array of object {value, label}', function () {
    const supportedFiats = UTILS.getSupportedFiats()
    supportedFiats.forEach((fiat) => {
      expect(fiat).toEqual(expect.objectContaining(
        {label: expect.any(String), value: expect.any(String)}
      ))
    })
  })
})

describe('isCompleteExchangeData', function () {
  describe('primaryDisplayAmount: undefined', function () {
    test('incomplete => false', function () {
      const incompleteExchangeData = {
        primaryDisplayAmount: undefined,
        primaryDisplayName: 'BTC',
        secondaryDisplaySymbol: '$',
        secondaryDisplayAmount: '4000',
        secondaryCurrencyCode: 'USD'
      }
      const expected = false
      // $FlowExpectedError
      const actual = UTILS.isCompleteExchangeData(incompleteExchangeData)
      expect(actual).toBe(expected)
    })
  })

  describe('primaryDisplayName: undefined', function () {
    test('incomplete => false', function () {
      const incompleteExchangeData = {
        primaryDisplayAmount: '1',
        primaryDisplayName: undefined,
        secondaryDisplaySymbol: '$',
        secondaryDisplayAmount: '4000',
        secondaryCurrencyCode: 'USD'
      }
      const expected = false
      // $FlowExpectedError
      const actual = UTILS.isCompleteExchangeData(incompleteExchangeData)
      expect(actual).toBe(expected)
    })
  })

  describe('secondaryDisplaySymbol: undefined', function () {
    test('incomplete => false', function () {
      const incompleteExchangeData = {
        primaryDisplayAmount: '1',
        primaryDisplayName: 'BTC',
        secondaryDisplaySymbol: undefined,
        secondaryDisplayAmount: '4000',
        secondaryCurrencyCode: 'USD'
      }
      const expected = false
      // $FlowExpectedError
      const actual = UTILS.isCompleteExchangeData(incompleteExchangeData)
      expect(actual).toBe(expected)
    })
  })

  describe('secondaryDisplayAmount: undefined', function () {
    test('incomplete => false', function () {
      const incompleteExchangeData = {
        primaryDisplayAmount: '1',
        primaryDisplayName: 'BTC',
        secondaryDisplaySymbol: '$',
        secondaryDisplayAmount: undefined,
        secondaryCurrencyCode: 'USD'
      }
      const expected = false
      // $FlowExpectedError
      const actual = UTILS.isCompleteExchangeData(incompleteExchangeData)
      expect(actual).toBe(expected)
    })
  })

  describe('secondaryCurrencyCode: undefined', function () {
    test('incomplete => false', function () {
      const incompleteExchangeData = {
        primaryDisplayAmount: '1',
        primaryDisplayName: 'BTC',
        secondaryDisplaySymbol: '$',
        secondaryDisplayAmount: '4000',
        secondaryCurrencyCode: undefined
      }
      const expected = false
      // $FlowExpectedError
      const actual = UTILS.isCompleteExchangeData(incompleteExchangeData)
      expect(actual).toBe(expected)
    })
  })

  test('complete => true', function () {
    const completeExchangeData = {
      primaryDisplayAmount: '1',
      primaryDisplayName: 'BTC',
      secondaryDisplaySymbol: '$',
      secondaryDisplayAmount: '4000',
      secondaryCurrencyCode: 'USD'
    }
    const expected = true
    const actual = UTILS.isCompleteExchangeData(completeExchangeData)
    expect(actual).toBe(expected)
  })
})

describe('mergeTokens', function () {
  test('Preferred tokens take precendence', function () {
    const preferredTokenA = {currencyCode: 'TA', currencyName: 'TA', preferred: true}
    const preferredTokenB = {currencyCode: 'TB', currencyName: 'TB', preferred: true}

    const tokenA = {currencyCode: 'TA', currencyName: 'TA'}
    const tokenD = {currencyCode: 'TD', currencyName: 'TD'}

    const preferredEdgeMetaTokens = [preferredTokenA, preferredTokenB]
    const edgeMetaTokens = [tokenA, tokenD]

    const expected = [
      preferredTokenA, // from preferredAbcTokens
      preferredTokenB, // from preferredAbcTokens
      tokenD
    ]
    // $FlowExpectedError
    const actual = UTILS.mergeTokens(preferredEdgeMetaTokens, edgeMetaTokens)
    expect(actual).toEqual(expected)
  })

  test('Empty preferredTokens', function () {
    const tokenA = {currencyCode: 'TA', currencyName: 'TA'}
    const tokenD = {currencyCode: 'TD', currencyName: 'TD'}

    const preferredEdgeMetaTokens = []
    const edgeMetaTokens = [tokenA, tokenD]

    const expected = [tokenA, tokenD]
    // $FlowExpectedError
    const actual = UTILS.mergeTokens(preferredEdgeMetaTokens, edgeMetaTokens)
    expect(actual).toEqual(expected)
  })

  test('Empty tokens', function () {
    const preferredTokenA = {currencyCode: 'TA', currencyName: 'TA', preferred: true}
    const preferredTokenB = {currencyCode: 'TB', currencyName: 'TB', preferred: true}

    const preferredEdgeMetaTokens = [preferredTokenA, preferredTokenB]
    const edgeMetaTokens = []

    const expected = [preferredTokenA, preferredTokenB]
    // $FlowExpectedError
    const actual = UTILS.mergeTokens(preferredEdgeMetaTokens, edgeMetaTokens)
    expect(actual).toEqual(expected)
  })
})

describe('getTimeMeasurement', function () {
  test('should return seconds measurement', function () {
    const expected = 'seconds'
    const actual = UTILS.getTimeMeasurement(0.9)
    expect(actual).toBe(expected)
  })

  test('should return minutes measurements', function () {
    // accept minutes
    const expected = 'minutes'
    expect(UTILS.getTimeMeasurement(1)).toBe(expected)
    expect(UTILS.getTimeMeasurement(59)).toBe(expected)
  })

  test('should return hours measurements', function () {
    const expected = 'hours'
    expect(UTILS.getTimeMeasurement(60)).toBe(expected)
    expect(UTILS.getTimeMeasurement(1439)).toBe(expected)
  })

  test('should return days measurements', function () {
    const expected = 'days'
    expect(UTILS.getTimeMeasurement(1440)).toBe(expected)
    expect(UTILS.getTimeMeasurement(50000)).toBe(expected)
  })
})

describe('getTimeWithMeasurement', function () {
  test(' => {measurement: "seconds", value: 35 }', function () {
    expect(UTILS.getTimeWithMeasurement(0.58)).toEqual({measurement: 'seconds', value: 35})
  })
  test(' => {measurement: "minutes", value: 2 }', function () {
    expect(UTILS.getTimeWithMeasurement(2)).toEqual({measurement: 'minutes', value: 2})
  })
  test(' => {measurement: "hours", value: 1 }', function () {
    expect(UTILS.getTimeWithMeasurement(60)).toEqual({measurement: 'hours', value: 1})
  })
  test(' => {measurement: "days", value: 1 }', function () {
    expect(UTILS.getTimeWithMeasurement(1440)).toEqual({measurement: 'days', value: 1})
  })
})

describe('getTimeInMinutes', function () {
  test('1 min => 1', function () {
    expect(UTILS.getTimeInMinutes({measurement: 'minutes', value: 1})).toEqual(1)
  })
  test('2 hours => 120', function () {
    expect(UTILS.getTimeInMinutes({measurement: 'hours', value: 2})).toEqual(120)
  })
  test('1 days => 1440', function () {
    expect(UTILS.getTimeInMinutes({measurement: 'days', value: 1})).toEqual(1440)
  })
  test('44 seconds => 0.73', function () {
    expect(UTILS.getTimeInMinutes({measurement: 'seconds', value: 44})).toEqual(0.73)
  })
})
