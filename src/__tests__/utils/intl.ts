import { formatNumberInput, formatToNativeNumber, isValidInput } from '../../locales/intl'

describe('locales/intl.ts', function () {
  test('formatNumberInput', function () {
    expect(formatNumberInput('')).toBe('0')
    expect(formatNumberInput('0')).toBe('0')
    expect(formatNumberInput('100')).toBe('100')
    expect(formatNumberInput('1000')).toBe('1,000')
    expect(() => formatNumberInput('1,000')).toThrow()
  })

  test('formatToNativeNumber', function () {
    // valid
    expect(formatToNativeNumber('')).toBe('')
    expect(formatToNativeNumber('0')).toBe('0')
    expect(formatToNativeNumber('1,000')).toBe('1000')
    expect(formatToNativeNumber('1.000')).toBe('1.000')
    expect(formatToNativeNumber('', { minDecimals: 1, maxDecimals: 1 })).toBe('')
    // odd but valid
    expect(formatToNativeNumber('1.000,00')).toBe('1.00000')
  })

  test('isValidInput', function () {
    // valid
    expect(isValidInput('')).toBe(true)
    expect(isValidInput('0')).toBe(true)
    expect(isValidInput('1.5')).toBe(true)
    expect(isValidInput('1,5')).toBe(true)
    expect(isValidInput('1,500.0')).toBe(true)
    expect(isValidInput('1.500,0')).toBe(true)
    // odd, but valid
    expect(isValidInput('1,5.0')).toBe(true)
    expect(isValidInput('1.5,0')).toBe(true)
    // invalid
    expect(isValidInput('abc')).toBe(false)
  })
})
