import { div } from 'biggystring'

import { formatFiatString } from '../../../hooks/useFiatText'
import { lstrings } from '../../../locales/strings'
import type { RampQuoteResult } from '../rampPluginTypes'

export const getRateFromRampQuoteResult = (
  quote: RampQuoteResult,
  fiatCode: string
): string => {
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
