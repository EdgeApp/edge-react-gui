import { describe, expect, test } from '@jest/globals'

import { toPercentString } from '../locales/intl'

describe('toPercentString', function () {
  test('Handles normal inputs', function () {
    expect(toPercentString(1 / 2)).toBe('50%')
    expect(toPercentString(-1 / 2)).toBe('-50%')
    expect(toPercentString(0)).toBe('0%')
    expect(toPercentString(1)).toBe('100%')
    expect(toPercentString(10)).toBe('1,000%')
    expect(toPercentString(2)).toBe('200%')
    expect(toPercentString(1 / 2, { plusSign: true })).toBe('+50%')
    expect(toPercentString(1 / 3, { maxPrecision: 3 })).toBe('33.333%')
  })

  test('Ignores bad numbers', function () {
    expect(toPercentString(Infinity)).toBe('')
    expect(toPercentString(NaN)).toBe('')
    expect(toPercentString(-1 / 1e10)).toBe('')
  })

  test('Ignores bad strings', function () {
    expect(toPercentString('')).toBe('')
    expect(toPercentString('--1')).toBe('')
    expect(toPercentString('1af0')).toBe('')
  })
})
