// @flow
/* globals describe test expect */

import { convertFeeToRoundedFee, isValidInput, truncateDecimals, zerosAfterDecimal } from '../util/conversionUtils'
import fixtures from './fixtures.json'

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

describe('zerosAfterDecimal', function () {
  const tests = fixtures.zerosAfterDecimal
  const { title, input, output } = tests

  input.forEach((amount, index) => {
    test(`${title} ${amount}`, function () {
      expect(zerosAfterDecimal(amount)).toBe(output[index])
    })
  })
})

describe('convertFeeToRoundedFee', function () {
  const tests = fixtures.convertFeeToRoundedFee
  const { title, input, output } = tests

  input.forEach((obj, index) => {
    const { amount, decimalPlacesBeyondLeadingZeros, multiplier } = obj
    test(`${title} ${amount}`, function () {
      const roundedFee = convertFeeToRoundedFee(amount, multiplier, decimalPlacesBeyondLeadingZeros)
      expect(roundedFee).toBe(output[index])
    })
  })
})
