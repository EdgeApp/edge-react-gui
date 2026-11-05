import { gt } from 'biggystring'

import { getExchangeDenom } from '../../../selectors/DenominationSelectors'
import { convertNativeToDenomination } from '../../../util/utils'
import type { RampQuote, RampQuoteRequest } from '../rampPluginTypes'
import { rampQuoteHasAmounts } from './rampQuotePriority'

/**
 * True when a sell quote spends more crypto than the request's wallet holds.
 * A max sell cannot exceed the balance, and a quote without amounts has nothing
 * to compare, so neither counts.
 */
export const isRampQuoteUnfunded = (
  quote: RampQuote,
  request: RampQuoteRequest
): boolean => {
  const { amountQuery, direction, tokenId, wallet } = request
  if (direction !== 'sell') return false
  if ('max' in amountQuery || 'maxExchangeAmount' in amountQuery) return false
  if (!rampQuoteHasAmounts(quote)) return false

  const { multiplier } = getExchangeDenom(wallet.currencyConfig, tokenId)
  const nativeBalance = wallet.balanceMap.get(tokenId) ?? '0'
  const balance = convertNativeToDenomination(multiplier)(nativeBalance)
  return gt(quote.cryptoAmount, balance)
}
