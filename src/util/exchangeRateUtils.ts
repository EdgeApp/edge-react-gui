import type { GuiExchangeRates } from '../types/types'

/**
 * Get all available fiat currencies from the exchange rates
 */
export function getAvailableFiatCurrencies(
  exchangeRates: GuiExchangeRates
): string[] {
  const fiats = new Set<string>()

  Object.keys(exchangeRates).forEach(key => {
    const [, fiatPart] = key.split('_')
    if (fiatPart?.startsWith('iso:')) {
      fiats.add(fiatPart)
    }
  })

  return Array.from(fiats)
}

/**
 * Check if we have exchange rates for a specific crypto/fiat pair
 */
export function hasRatesForCurrency(
  exchangeRates: GuiExchangeRates,
  cryptoCode: string,
  fiatCode: string
): boolean {
  const key = `${cryptoCode}_${fiatCode}`
  return exchangeRates[key] != null && exchangeRates[key] > 0
}

/**
 * Check if we have any rates for a given fiat currency
 */
export function hasRatesForFiat(
  exchangeRates: GuiExchangeRates,
  fiatCode: string
): boolean {
  // Check common crypto currencies as proxies
  const commonCryptos = ['BTC', 'ETH', 'USDT', 'USDC']

  for (const crypto of commonCryptos) {
    if (hasRatesForCurrency(exchangeRates, crypto, fiatCode)) {
      return true
    }
  }

  return false
}

/**
 * Get the exchange rate for a crypto/fiat pair with fallback to USD
 */
export function getExchangeRateWithFallback(
  exchangeRates: GuiExchangeRates,
  cryptoCode: string,
  fiatCode: string,
  fallbackFiatCode: string = 'iso:USD'
): { rate: number; isFallback: boolean } {
  const directRate = exchangeRates[`${cryptoCode}_${fiatCode}`]

  if (directRate != null && directRate > 0) {
    return { rate: directRate, isFallback: false }
  }

  // Try fallback
  const fallbackRate = exchangeRates[`${cryptoCode}_${fallbackFiatCode}`]
  if (fallbackRate != null && fallbackRate > 0) {
    return { rate: fallbackRate, isFallback: true }
  }

  return { rate: 0, isFallback: false }
}
