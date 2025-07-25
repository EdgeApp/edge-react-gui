import { mul } from 'biggystring'
import {
  EdgeCurrencyInfo,
  EdgeCurrencyWallet,
  EdgeDenomination
} from 'edge-core-js'

import { RootState, ThunkAction } from '../types/reduxTypes'
import { GuiExchangeRates } from '../types/types'
import { getWalletTokenId } from '../util/CurrencyInfoHelpers'
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

export const getActiveWalletCurrencyInfos = (currencyWallets: {
  [walletId: string]: EdgeCurrencyWallet
}): EdgeCurrencyInfo[] => {
  const activeCurrencyInfos: { [pluginId: string]: EdgeCurrencyInfo } = {}

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
  fromCurrencyCode: string,
  toCurrencyCode: string
): number => {
  const exchangeRates = state.exchangeRates
  const rateKey = `${fromCurrencyCode}_${toCurrencyCode}`
  const rate = exchangeRates[rateKey] ?? 0
  return rate
}

export const convertCurrency = (
  state: RootState,
  fromCurrencyCode: string,
  toCurrencyCode: string,
  amount: string = '1'
): string => {
  const exchangeRate = getExchangeRate(state, fromCurrencyCode, toCurrencyCode)
  const convertedAmount = mul(amount, exchangeRate)
  return convertedAmount
}

export function convertCurrencyFromState(
  fromCurrencyCode: string,
  toCurrencyCode: string,
  amount: string = '1'
): ThunkAction<string> {
  return (dispatch, getState): string => {
    const state = getState()
    const exchangeRate = getExchangeRate(
      state,
      fromCurrencyCode,
      toCurrencyCode
    )
    const convertedAmount = mul(amount, exchangeRate)
    return convertedAmount
  }
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
    currencyCode,
    isoFiatCurrencyCode,
    cryptoAmount
  )
  return fiatValue
}
