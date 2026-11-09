import { div, mul } from 'biggystring'

/**
 * The given percent of a native balance, floored to a whole native unit so the
 * result never exceeds that share of the balance.
 */
export const getPercentNativeAmount = (
  nativeBalance: string,
  percent: string
): string => div(mul(nativeBalance, percent), '100', 0)

/**
 * The given percent of a native balance in exchange units, truncated to the
 * decimals the amount field accepts.
 */
export const getPercentExchangeAmount = (
  nativeBalance: string,
  percent: string,
  multiplier: string,
  maxDecimals: number
): string =>
  div(getPercentNativeAmount(nativeBalance, percent), multiplier, maxDecimals)
