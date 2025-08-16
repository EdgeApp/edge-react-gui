import { mul } from 'biggystring'
import type {
  EdgeCurrencyInfo,
  EdgeCurrencyWallet,
  EdgeDenomination,
  EdgeTokenId
} from 'edge-core-js'

import type { RootState } from '../types/reduxTypes'
import type { GuiExchangeRates } from '../types/types'
import { getWalletTokenId } from '../util/CurrencyInfoHelpers'
import { createRateKey } from '../util/exchangeRates'
import {
  convertCurrencyFromExchangeRates,
  convertNativeToExchange,
  zeroString
} from '../util/utils'

export function getSelectedCurrencyWallet(
  state: RootState
): EdgeCurrencyWallet {
  return state.core.account.currencyWallets[state.ui.wallets.selectedWalletId]
}

export const getActiveWalletCurrencyInfos = (
  currencyWallets: Record<string, EdgeCurrencyWallet>
): EdgeCurrencyInfo[] => {
  const activeCurrencyInfos: Record<string, EdgeCurrencyInfo> = {}

  for (const walletId of Object.keys(currencyWallets)) {
    if (
      activeCurrencyInfos[currencyWallets[walletId].currencyInfo.pluginId] ==
      null
    ) {
      activeCurrencyInfos[currencyWallets[walletId].currencyInfo.pluginId] =
        currencyWallets[walletId].currencyInfo
    }
  }

  return Object.keys(activeCurrencyInfos).map(
    pluginId => activeCurrencyInfos[pluginId]
  )
}

export const getExchangeRate = (
  state: RootState,
  pluginId: string,
  tokenId: EdgeTokenId,
  toCurrencyCode: string
): number => {
  const exchangeRates = state.exchangeRates

  const rateKey = createRateKey({ pluginId, tokenId }, toCurrencyCode)
  const rate = exchangeRates[rateKey] ?? 0
  return rate
}
export const getFiatExchangeRate = (
  state: RootState,
  fromIsoCode: string,
  toIsoCode: string
): number => {
  const exchangeRates = state.exchangeRates
  const rateKey = createRateKey(fromIsoCode, toIsoCode)
  const rate = exchangeRates[rateKey] ?? 0
  return rate
}

export const convertCurrency = (
  state: RootState,
  pluginId: string,
  tokenId: EdgeTokenId,
  toCurrencyCode: string,
  amount: string = '1'
): string => {
  const exchangeRate = getExchangeRate(state, pluginId, tokenId, toCurrencyCode)
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
  isoFiatCurrencyCode: string,
  exchangeDenomination: EdgeDenomination,
  exchangeRates: GuiExchangeRates
): string => {
  const currencyCode = exchangeDenomination.name
  const tokenId = getWalletTokenId(wallet, currencyCode)
  const nativeBalance = wallet.balanceMap.get(tokenId) ?? '0'
  if (zeroString(nativeBalance)) return '0'
  const nativeToExchangeRatio: string = exchangeDenomination.multiplier
  const cryptoAmount = convertNativeToExchange(nativeToExchangeRatio)(
    nativeBalance
  )
  const fiatValue = convertCurrencyFromExchangeRates(
    exchangeRates,
    wallet.currencyInfo.pluginId,
    null,
    isoFiatCurrencyCode,
    cryptoAmount
  )
  return fiatValue
}
