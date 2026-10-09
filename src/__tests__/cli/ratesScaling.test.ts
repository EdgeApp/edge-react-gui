import { describe, expect, it } from '@jest/globals'

import { displayToNative } from '../../cli/engine/routes/rates'

/**
 * The one piece of CLI arithmetic whose output is a spend amount.
 *
 * `rates-usd-to-native` answers `nativeAmount`, documented as "What a spend
 * actually takes", from `(usdAmount / rate).toFixed(8)` times the asset's
 * multiplier. The rest of that handler needs the live rates server, so this
 * was unreachable from any test; a wrong answer here is wrong by orders of
 * magnitude and looks plausible.
 */
describe('displayToNative', () => {
  it('scales whole coins by an 8-decimal multiplier', () => {
    expect(displayToNative('1.00000000', '100000000')).toBe('100000000')
    expect(displayToNative('0.00012345', '100000000')).toBe('12345')
  })

  it('scales an 8-decimal input by an 18-decimal multiplier', () => {
    // A USD notional always arrives as `toFixed(8)`, so against ETH's
    // multiplier the last ten digits are zeros rather than lost precision.
    expect(displayToNative('1.23456789', '1000000000000000000')).toBe(
      '1234567890000000000'
    )
  })

  it('floors rather than rounding', () => {
    // A native amount is an integer number of the smallest unit, and a spend
    // must never be scaled *up* past what the caller asked for.
    expect(displayToNative('0.000000005', '100000000')).toBe('0')
    expect(displayToNative('1.999999999', '100000000')).toBe('199999999')
  })

  it('handles an amount small enough to floor to nothing', () => {
    // 1e-8 USD of an 8-decimal coin is below one satoshi. Zero is the honest
    // answer; `makeSpend` is what refuses it.
    expect(displayToNative('0.00000000', '100000000')).toBe('0')
  })

  it('throws on a malformed multiplier rather than inventing a number', () => {
    // `asPositiveBiggystring` refuses this at the declaration, so the route
    // answers 400 — but the function must not scrub it either, because a
    // plausible-looking wrong amount is worse than a throw.
    expect(() => displayToNative('1.0', 'abc')).toThrow()
    expect(() => displayToNative('abc', '100000000')).toThrow()
  })

  it('reads exponential notation, which the route cannot produce anyway', () => {
    // Measured, because the route's `(usdAmount / rate).toFixed(8)` means a
    // caller never reaches this with an exponential — and if `toFixed` were
    // ever dropped, `String(1e-7)` is `"1e-7"`, which biggystring scales
    // correctly rather than reading as 1. Result in decimal either way.
    expect(displayToNative(String(1e-7), '100000000')).toBe('10')
    expect(displayToNative((1e-7).toFixed(8), '100000000')).toBe('10')
    expect(displayToNative(String(1e-9), '100000000')).toBe('0')
  })
})
