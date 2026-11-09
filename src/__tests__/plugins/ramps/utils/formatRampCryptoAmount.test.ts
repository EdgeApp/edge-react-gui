import { describe, expect, it } from '@jest/globals'

import { formatRampCryptoAmount } from '../../../../plugins/ramps/utils/formatRampCryptoAmount'

const SOL_RATE = 117.67
const USDC_RATE = 1
const BTC_RATE = 110000

describe('formatRampCryptoAmount', () => {
  it('cuts decimals worth less than $0.01', () => {
    expect(formatRampCryptoAmount('0.388792343', SOL_RATE)).toBe('0.38879')
    expect(formatRampCryptoAmount('47.569', USDC_RATE)).toBe('47.56')
    expect(formatRampCryptoAmount('0.123456789', BTC_RATE)).toBe('0.12345678')
  })

  it('truncates instead of rounding', () => {
    expect(formatRampCryptoAmount('0.388799999', SOL_RATE)).toBe('0.38879')
  })

  it('removes trailing zeros', () => {
    expect(formatRampCryptoAmount('0.39900000', SOL_RATE)).toBe('0.399')
    expect(formatRampCryptoAmount('47.56000000', USDC_RATE)).toBe('47.56')
    expect(formatRampCryptoAmount('47.00', USDC_RATE)).toBe('47')
    expect(formatRampCryptoAmount('47.', USDC_RATE)).toBe('47')
  })

  it('removes zeros exposed by the cut', () => {
    expect(formatRampCryptoAmount('0.390001', SOL_RATE)).toBe('0.39')
    expect(formatRampCryptoAmount('12.000001', SOL_RATE)).toBe('12')
  })

  it('leaves whole numbers alone', () => {
    expect(formatRampCryptoAmount('1000', SOL_RATE)).toBe('1000')
    expect(formatRampCryptoAmount('0', SOL_RATE)).toBe('0')
  })

  it('shows no decimals when a whole coin is worth a cent or less', () => {
    expect(formatRampCryptoAmount('123.45', 0.01)).toBe('123')
    expect(formatRampCryptoAmount('123.45', 0.0001)).toBe('123')
  })

  it('keeps a decimal place per power of ten at exact rates', () => {
    expect(formatRampCryptoAmount('1.2345', 0.1)).toBe('1.2')
    expect(formatRampCryptoAmount('1.2345', 1)).toBe('1.23')
    expect(formatRampCryptoAmount('1.2345', 10)).toBe('1.234')
  })

  it('only trims zeros when the rate is unknown', () => {
    expect(formatRampCryptoAmount('0.388792343', 0)).toBe('0.388792343')
    expect(formatRampCryptoAmount('0.39900000', 0)).toBe('0.399')
  })

  it('never shows a non-zero amount as zero', () => {
    expect(formatRampCryptoAmount('0.00000412', SOL_RATE)).toBe('0.00000412')
    expect(formatRampCryptoAmount('0.5', 0.001)).toBe('0.5')
    expect(formatRampCryptoAmount('0.00000000', SOL_RATE)).toBe('0')
  })

  it('returns anything but a plain decimal as received', () => {
    expect(formatRampCryptoAmount('1e-7', SOL_RATE)).toBe('1e-7')
    expect(formatRampCryptoAmount('', SOL_RATE)).toBe('')
  })
})
