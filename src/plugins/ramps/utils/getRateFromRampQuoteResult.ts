import { div } from 'biggystring'

import { formatFiatString } from '../../../hooks/useFiatText'
import { lstrings } from '../../../locales/strings'
import type { RampQuote } from '../rampPluginTypes'

export const getRateFromRampQuoteResult = (
  quote: RampQuote | undefined,
  fiatCode: string
): string => {
  if (quote == null) return ''
  if (quote.specialQuoteRateMessage != null) {
    return quote.specialQuoteRateMessage
  }
  // Protect against division by zero
  if (quote.cryptoAmount === '0')
    return lstrings.trade_option_invalid_quote_zero_crypto
  const bestRate = div(quote.fiatAmount, quote.cryptoAmount, 16)
  const localeRate = formatFiatString({
    fiatAmount: bestRate,
    autoPrecision: false
  })
  let exchangeRateText
  if (quote.isEstimate) {
    exchangeRateText = `1 ${quote.displayCurrencyCode} ≈ ${localeRate} ${fiatCode}\n${lstrings.estimated_quote}`
  } else {
    exchangeRateText = `1 ${quote.displayCurrencyCode} = ${localeRate} ${fiatCode}`
  }
  return exchangeRateText
}
