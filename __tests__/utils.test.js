/* globals describe test expect */
// @flow

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

describe('convertExchangeToDisplay', function () {
  test('1 => 1', function () {
    const nativeToDisplayRatio = '100000000'
    const displayAmount = '1'
    const expected = '100000000'
    const actual = UTILS.convertDisplayToNative(nativeToDisplayRatio)(displayAmount)
    expect(actual).toBe(expected)
  })

  test('1.00000000 => 1', function () {
    const nativeToDisplayRatio = '100000000'
    const displayAmount = '1.00000000'
    const expected = '100000000'
    const actual = UTILS.convertDisplayToNative(nativeToDisplayRatio)(displayAmount)
    expect(actual).toBe(expected)
  })

  test('1.123456789 => 1.123456789', function () {
    const nativeToDisplayRatio = '100000000'
    const displayAmount = '1.12345678'
    const expected = '112345678'
    const actual = UTILS.convertDisplayToNative(nativeToDisplayRatio)(displayAmount)
    expect(actual).toBe(expected)
  })
})

describe('convertExchangeToExchange', function () {
  test('1 => 1000', function () {
    const ratio = '1000.00000000'
    const exchangeAmount = '1'
    const expected = '1000'
    const actual = UTILS.convertExchangeToExchange(ratio)(exchangeAmount)
    expect(actual).toBe(expected)
  })

  test('1000 => 1000', function () {
    const ratio = '1.00000000'
    const exchangeAmount = '1000'
    const expected = '1000'
    const actual = UTILS.convertExchangeToExchange(ratio)(exchangeAmount)
    expect(actual).toBe(expected)
  })

  test('1000 => 1', function () {
    const ratio = '.00100000'
    const exchangeAmount = '1000'
    const expected = '1'
    const actual = UTILS.convertExchangeToExchange(ratio)(exchangeAmount)
    expect(actual).toBe(expected)
  })
})

describe('deriveDisplayToExchangeRatio', function () {
  test('1 / 1', function () {
    const exchangeNativeToExchangeRatio = '100000000'
    const displayNativeToDisplayRatio = '100000000'
    const expected = '1'
    const actual = UTILS.deriveDisplayToExchangeRatio(exchangeNativeToExchangeRatio)(displayNativeToDisplayRatio)
    expect(actual).toBe(expected)
  })

  test('1000 / 10', function () {
    const exchangeNativeToExchangeRatio = '1000'
    const displayNativeToDisplayRatio = '10'
    const expected = '100'
    const actual = UTILS.deriveDisplayToExchangeRatio(exchangeNativeToExchangeRatio)(displayNativeToDisplayRatio)
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
})

describe('absoluteValue', function () {
  test('1 => 1', function () {
    const input = '1'
    const expected = '1'
    const actual = UTILS.absoluteValue(input)
    expect(actual).toBe(expected)
  })

  test('-1 => 1', function () {
    const input = '-1'
    const expected = '1'
    const actual = UTILS.absoluteValue(input)
    expect(actual).toBe(expected)
  })

  test('-1.0 => 1.0', function () {
    const input = '-1.0'
    const expected = '1.0'
    const actual = UTILS.absoluteValue(input)
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

describe('isGreaterThan', function () {
  test('5.123 > 5.123 => false', function () {
    const amountString = '5.123'
    const comparedTo = '5.123'
    const expected = false
    const actual = UTILS.isGreaterThan(comparedTo)(amountString)
    expect(actual).toBe(expected)
  })

  test('5.123 > 4.123 => true', function () {
    const amountString = '5.123'
    const comparedTo = '4.123'
    const expected = true
    const actual = UTILS.isGreaterThan(comparedTo)(amountString)
    expect(actual).toBe(expected)
  })

  test('4.123 > 5.123 => false', function () {
    const amountString = '4.123'
    const comparedTo = '5.123'
    const expected = false
    const actual = UTILS.isGreaterThan(comparedTo)(amountString)
    expect(actual).toBe(expected)
  })

  test('1.123 > 0 => true', function () {
    const amountString = '1.123'
    const comparedTo = '0'
    const expected = true
    const actual = UTILS.isGreaterThan(comparedTo)(amountString)
    expect(actual).toBe(expected)
  })

  test('1.123 > 0.0 => true', function () {
    const amountString = '1.123'
    const comparedTo = '0.0'
    const expected = true
    const actual = UTILS.isGreaterThan(comparedTo)(amountString)
    expect(actual).toBe(expected)
  })

  test('-1.123 > 0 => false', function () {
    const amountString = '-1.123'
    const comparedTo = '0'
    const expected = false
    const actual = UTILS.isGreaterThan(comparedTo)(amountString)
    expect(actual).toBe(expected)
  })

  test('-1.123 > 0.0 => false', function () {
    const amountString = '-1.123'
    const comparedTo = '0.0'
    const expected = false
    const actual = UTILS.isGreaterThan(comparedTo)(amountString)
    expect(actual).toBe(expected)
  })
})

describe('isCompleteExchangeData', function () {
  describe('secondaryDisplayAmount: undefined', function () {
    test('incomplete => false', function () {
      const incompleteExchangeData = {
        secondaryDisplayAmount: undefined,
        cryptoCurrencyCode: 'BTC',
        fiatSymbol: '$',
        fiatExchangeAmount: '4000',
        fiatCurrencyCode: 'USD'
      }
      const expected = false
      // $FlowFixMe
      const actual = UTILS.isCompleteExchangeData(incompleteExchangeData)
      expect(actual).toBe(expected)
    })
  })

  describe('cryptoCurrencyCode: undefined', function () {
    test('incomplete => false', function () {
      const incompleteExchangeData = {
        secondaryDisplayAmount: '4000',
        cryptoCurrencyCode: undefined,
        fiatSymbol: '$',
        fiatExchangeAmount: '4000',
        fiatCurrencyCode: 'USD'
      }
      const expected = false
      // $FlowFixMe
      const actual = UTILS.isCompleteExchangeData(incompleteExchangeData)
      expect(actual).toBe(expected)
    })
  })

  describe('fiatSymbol: undefined', function () {
    test('incomplete => false', function () {
      const incompleteExchangeData = {
        secondaryDisplayAmount: '4000',
        cryptoCurrencyCode: 'BTC',
        fiatSymbol: undefined,
        fiatExchangeAmount: '4000',
        fiatCurrencyCode: 'USD'
      }
      const expected = false
      // $FlowFixMe
      const actual = UTILS.isCompleteExchangeData(incompleteExchangeData)
      expect(actual).toBe(expected)
    })
  })

  describe('fiatExchangeAmount: undefined', function () {
    test('incomplete => false', function () {
      const incompleteExchangeData = {
        secondaryDisplayAmount: '4000',
        cryptoCurrencyCode: 'BTC',
        fiatSymbol: '$',
        fiatExchangeAmount: undefined,
        fiatCurrencyCode: 'USD'
      }
      const expected = false
      // $FlowFixMe
      const actual = UTILS.isCompleteExchangeData(incompleteExchangeData)
      expect(actual).toBe(expected)
    })
  })

  describe('fiatCurrencyCode: undefined', function () {
    test('incomplete => false', function () {
      const incompleteExchangeData = {
        secondaryDisplayAmount: '4000',
        cryptoCurrencyCode: 'BTC',
        fiatSymbol: '$',
        fiatExchangeAmount: '4000',
        fiatCurrencyCode: undefined
      }
      const expected = false
      // $FlowFixMe
      const actual = UTILS.isCompleteExchangeData(incompleteExchangeData)
      expect(actual).toBe(expected)
    })
  })

  test('complete => true', function () {
    const exchangeData = {
      secondaryDisplayAmount: '4000',
      cryptoCurrencyCode: 'BTC',
      fiatSymbol: '$',
      fiatExchangeAmount: '4000',
      fiatCurrencyCode: 'USD'
    }
    const expected = true
    const actual = UTILS.isCompleteExchangeData(exchangeData)
    expect(actual).toBe(expected)
  })
})
