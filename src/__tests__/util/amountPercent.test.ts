import { describe, expect, it } from '@jest/globals'

import {
  getPercentExchangeAmount,
  getPercentNativeAmount
} from '../../util/amountPercent'

describe('getPercentNativeAmount', () => {
  it('takes the share of a balance', () => {
    expect(getPercentNativeAmount('1000', '25')).toBe('250')
    expect(getPercentNativeAmount('1000', '50')).toBe('500')
    expect(getPercentNativeAmount('1000', '75')).toBe('750')
  })

  it('floors to a whole native unit', () => {
    expect(getPercentNativeAmount('999', '25')).toBe('249')
    expect(getPercentNativeAmount('3', '75')).toBe('2')
  })

  it('handles an 18-decimal balance without losing precision', () => {
    expect(getPercentNativeAmount('1234567890123456789012', '75')).toBe(
      '925925917592592591759'
    )
  })

  it('returns zero for an empty balance or dust', () => {
    expect(getPercentNativeAmount('0', '50')).toBe('0')
    expect(getPercentNativeAmount('1', '25')).toBe('0')
  })
})

describe('getPercentExchangeAmount', () => {
  it('converts the share to exchange units', () => {
    expect(getPercentExchangeAmount('100000000', '25', '100000000', 9)).toBe(
      '0.25'
    )
  })

  it('truncates to the field decimals rather than rounding up', () => {
    // 75% of 1.999999999999999999 ETH is 1.49999999999999999925:
    expect(
      getPercentExchangeAmount(
        '1999999999999999999',
        '75',
        '1000000000000000000',
        9
      )
    ).toBe('1.499999999')
  })

  it('returns zero when the share truncates away', () => {
    expect(
      getPercentExchangeAmount('100', '25', '1000000000000000000', 9)
    ).toBe('0')
  })
})
