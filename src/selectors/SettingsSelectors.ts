import { RootState } from '../types/reduxTypes'
import { removeIsoPrefix } from '../util/utils'

export const getDefaultFiat = (state: RootState) => {
  const defaultIsoFiat: string = state.ui.settings.defaultIsoFiat
  return removeIsoPrefix(defaultIsoFiat)
}

/**
 * Returns the fiat currency code for use in charting & history.
 * We only have historical data for certain fiat currencies,
 * but we need history for both the crypto and the fiat sides
 * to make an accurate chart. If this isn't possible, fall back to USD.
 */
export const getCoingeckoFiat = (state: RootState) => {
  const defaultIsoFiat: string = state.ui.settings.defaultIsoFiat
  const defaultFiat = removeIsoPrefix(defaultIsoFiat)
  return COINGECKO_SUPPORTED_FIATS[defaultFiat as keyof typeof COINGECKO_SUPPORTED_FIATS] != null ? defaultFiat : 'USD'
}

/**
 * Fiat currency codes that CoinGecko has historical rates for.
 * HACK: To be moved to a CoinGecko query in the info or rates server.
 * Hard-coded "vs" currencies manually filtered for fiat currency codes for now.
 */
const COINGECKO_SUPPORTED_FIATS = {
  AED: true,
  ARS: true,
  AUD: true,
  BDT: true,
  BHD: true,
  BMD: true,
  BRL: true,
  CAD: true,
  CHF: true,
  CLP: true,
  CZK: true,
  DKK: true,
  EUR: true,
  GBP: true,
  GEL: true,
  HKD: true,
  HUF: true,
  ILS: true,
  INR: true,
  KWD: true,
  LKR: true,
  MMK: true,
  MXN: true,
  MYR: true,
  NGN: true,
  NOK: true,
  NZD: true,
  PHP: true,
  PKR: true,
  PLN: true,
  SAR: true,
  SEK: true,
  SGD: true,
  THB: true,
  TRY: true,
  UAH: true,
  VEF: true,
  VND: true,
  ZAR: true,
  XDR: true
}
