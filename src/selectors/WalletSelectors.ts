import { mul } from 'biggystring'
import type {
  EdgeCurrencyInfo,
  EdgeCurrencyWallet,
  EdgeDenomination,
  EdgeTokenId
} from 'edge-core-js'

import type { GuiExchangeRates } from '../actions/ExchangeRateActions'
import type { RootState } from '../types/reduxTypes'
import { convertNativeToExchange, zeroString } from '../util/utils'

export const getActiveWalletCurrencyInfos = (
  currencyWallets: Record<string, EdgeCurrencyWallet>
): EdgeCurrencyInfo[] => {
  const activeCurrencyInfos: Record<string, EdgeCurrencyInfo> = {}

  for (const walletId of Object.keys(currencyWallets)) {
    activeCurrencyInfos[currencyWallets[walletId].currencyInfo.pluginId] ??=
      currencyWallets[walletId].currencyInfo
  }

  return Object.keys(activeCurrencyInfos).map(
    pluginId => activeCurrencyInfos[pluginId]
  )
}

export const getExchangeRate = (
  exchangeRates: GuiExchangeRates,
  pluginId: string,
  tokenId: EdgeTokenId,
  toCurrencyCode: string
): number => {
  const rateObj =
    exchangeRates.crypto[pluginId]?.[tokenId ?? '']?.[toCurrencyCode]
  if (rateObj?.current != null) return rateObj.current

  // if not found, try to find USD path
  const rateUSD =
    exchangeRates.crypto?.[pluginId]?.[tokenId ?? '']?.['iso:USD']?.current ?? 0
  const fiatUSD =
    exchangeRates.fiat?.[toCurrencyCode]?.['iso:USD']?.current ?? 0
  if (rateUSD === 0 || fiatUSD === 0) return 0

  const foundRate = rateUSD / fiatUSD
  return foundRate
}

export const getFiatExchangeRate = (
  state: RootState,
  fromIsoCode: string,
  toIsoCode: string
): number => {
  // Use the direct rate if we have it:
  const rate = state.exchangeRates.fiat[fromIsoCode]?.[toIsoCode]
  if (rate?.current != null) return rate.current

  // Convert via USD as a fallback:
  const fromUSD = state.exchangeRates.fiat?.[fromIsoCode]?.['iso:USD']?.current
  const toUSD = state.exchangeRates.fiat?.[toIsoCode]?.['iso:USD']?.current
  if (fromUSD == null) return 0
  if (toUSD == null || toUSD === 0) return 0

  const foundRate = fromUSD / toUSD
  return foundRate
}

export const convertCurrency = (
  exchangeRates: GuiExchangeRates,
  pluginId: string,
  tokenId: EdgeTokenId,
  fiatCode: string,
  amount: string = '1'
): string => {
  const exchangeRate = getExchangeRate(
    exchangeRates,
    pluginId,
    tokenId,
    fiatCode
  )
  const convertedAmount = mul(amount, exchangeRate)
  return convertedAmount
}

export const convertFiatCurrency = (
  state: RootState,
  fromFiatCode: string,
  toFiatCode: string,
  amount: string = '1'
): string => {
  const exchangeRate = getFiatExchangeRate(state, fromFiatCode, toFiatCode)
  const convertedAmount = mul(amount, exchangeRate)
  return convertedAmount
}

export const calculateFiatBalance = (
  wallet: EdgeCurrencyWallet,
  tokenId: EdgeTokenId,
  isoFiatCurrencyCode: string,
  exchangeDenomination: EdgeDenomination,
  exchangeRates: GuiExchangeRates
): string => {
  const nativeBalance = wallet.balanceMap.get(tokenId) ?? '0'
  if (zeroString(nativeBalance)) return '0'
  const nativeToExchangeRatio: string = exchangeDenomination.multiplier
  const cryptoAmount = convertNativeToExchange(nativeToExchangeRatio)(
    nativeBalance
  )
  const fiatValue = convertCurrency(
    exchangeRates,
    wallet.currencyInfo.pluginId,
    tokenId,
    isoFiatCurrencyCode,
    cryptoAmount
  )
  return fiatValue
}
