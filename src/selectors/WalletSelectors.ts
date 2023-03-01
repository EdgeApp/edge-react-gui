import { mul } from 'biggystring'
import { EdgeCurrencyInfo, EdgeCurrencyWallet, EdgeDenomination } from 'edge-core-js'

import { RootState, ThunkAction } from '../types/reduxTypes'
import { getWalletFiat } from '../util/CurrencyWalletHelpers'
import { convertNativeToExchange, zeroString } from '../util/utils'

export function getSelectedCurrencyWallet(state: RootState): EdgeCurrencyWallet {
  return state.core.account.currencyWallets[state.ui.wallets.selectedWalletId]
}

export const getActiveWalletCurrencyInfos = (currencyWallets: { [walletId: string]: EdgeCurrencyWallet }): EdgeCurrencyInfo[] => {
  const activeCurrencyInfos: { [pluginId: string]: EdgeCurrencyInfo } = {}

  for (const walletId of Object.keys(currencyWallets)) {
    if (activeCurrencyInfos[currencyWallets[walletId].currencyInfo.pluginId] == null) {
      activeCurrencyInfos[currencyWallets[walletId].currencyInfo.pluginId] = currencyWallets[walletId].currencyInfo
    }
  }

  return Object.keys(activeCurrencyInfos).map(pluginId => activeCurrencyInfos[pluginId])
}

export const getExchangeRate = (state: RootState, fromCurrencyCode: string, toCurrencyCode: string): string => {
  const exchangeRates = state.exchangeRates
  const rateKey = `${fromCurrencyCode}_${toCurrencyCode}`
  const rate = exchangeRates[rateKey] ?? '0'
  return rate
}

export const convertCurrency = (state: RootState, fromCurrencyCode: string, toCurrencyCode: string, amount: string = '1'): string => {
  const exchangeRate = getExchangeRate(state, fromCurrencyCode, toCurrencyCode)
  const convertedAmount = mul(amount, exchangeRate)
  return convertedAmount
}

export function convertCurrencyFromState(fromCurrencyCode: string, toCurrencyCode: string, amount: string = '1'): ThunkAction<string> {
  return (dispatch, getState): string => {
    const state = getState()
    const exchangeRate = getExchangeRate(state, fromCurrencyCode, toCurrencyCode)
    const convertedAmount = mul(amount, exchangeRate)
    return convertedAmount
  }
}

export const convertCurrencyFromExchangeRates = (
  exchangeRates: { [pair: string]: string },
  fromCurrencyCode: string,
  toCurrencyCode: string,
  amount: string
): string => {
  const rateKey = `${fromCurrencyCode}_${toCurrencyCode}`
  const rate = exchangeRates[rateKey] ?? '0'
  const convertedAmount = mul(amount, rate)
  return convertedAmount
}

export const calculateFiatBalance = (wallet: EdgeCurrencyWallet, exchangeDenomination: EdgeDenomination, exchangeRates: { [pair: string]: string }): string => {
  const currencyCode = exchangeDenomination.name
  const nativeBalance = wallet.balances[currencyCode] ?? '0'
  if (zeroString(nativeBalance)) return '0'
  const nativeToExchangeRatio: string = exchangeDenomination.multiplier
  const cryptoAmount = convertNativeToExchange(nativeToExchangeRatio)(nativeBalance)
  const { isoFiatCurrencyCode } = getWalletFiat(wallet)
  const fiatValue = convertCurrencyFromExchangeRates(exchangeRates, currencyCode, isoFiatCurrencyCode, cryptoAmount)
  return fiatValue
}

export const findWalletByFioAddress = async (state: RootState, fioAddress: string): Promise<EdgeCurrencyWallet | null> => {
  const fioWallets: EdgeCurrencyWallet[] = state.ui.wallets.fioWallets

  if (fioWallets && fioWallets.length) {
    for (const wallet of fioWallets) {
      const fioAddresses: string[] = await wallet.otherMethods.getFioAddressNames()
      if (fioAddresses.length > 0) {
        for (const address of fioAddresses) {
          if (address.toLowerCase() === fioAddress.toLowerCase()) {
            return wallet
          }
        }
      }
    }

    return null
  } else {
    return null
  }
}
