// @flow

import { bns } from 'biggystring'
import { type EdgeCurrencyWallet } from 'edge-core-js'

import { formatNumber } from '../locales/intl.js'
import { type RootState } from '../types/reduxTypes.js'
import { type GuiWallet } from '../types/types.js'
import { convertNativeToExchange } from '../util/utils.js'

export function getSelectedWallet(state: RootState): GuiWallet {
  return state.ui.wallets.byId[state.ui.wallets.selectedWalletId]
}

export const getActiveWalletCurrencyCodes = (state: RootState) => {
  const { account } = state.core
  const { activeWalletIds, currencyWallets } = account
  const currencyCodesMap = activeWalletIds.reduce((map, id) => {
    const wallet = currencyWallets[id]
    if (!wallet) return map

    map[wallet.currencyInfo.currencyCode] = true
    return map
  }, {})
  const currencyCodes: string[] = Object.keys(currencyCodesMap)
  return currencyCodes
}

export const getActiveWalletCurrencyInfos = (state: RootState) => {
  const currencyInfos = []
  const { account } = state.core
  const { currencyConfig = {} } = account
  const activeCurrencyCodes = getActiveWalletCurrencyCodes(state)
  for (const pluginId of Object.keys(currencyConfig)) {
    const info = currencyConfig[pluginId].currencyInfo
    if (activeCurrencyCodes.includes(info.currencyCode)) {
      currencyInfos.push(info)
    }
  }
  return currencyInfos
}

export const getExchangeRate = (state: RootState, fromCurrencyCode: string, toCurrencyCode: string): number => {
  const exchangeRates = state.exchangeRates
  const rateKey = `${fromCurrencyCode}_${toCurrencyCode}`
  const rate = exchangeRates[rateKey] ? exchangeRates[rateKey] : 0
  return rate
}

export const convertCurrency = (state: RootState, fromCurrencyCode: string, toCurrencyCode: string, amount: string = '1'): string => {
  const exchangeRate = getExchangeRate(state, fromCurrencyCode, toCurrencyCode)
  const convertedAmount = bns.mul(amount, exchangeRate.toFixed(18))
  return convertedAmount
}

const convertCurrencyWithoutState = (exchangeRates: { [string]: string }, fromCurrencyCode: string, toCurrencyCode: string, amount: string = '1'): string => {
  const rateKey = `${fromCurrencyCode}_${toCurrencyCode}`
  const exchangeRate = exchangeRates[rateKey] ? exchangeRates[rateKey] : '0'
  const convertedAmount = bns.mul(amount, exchangeRate)
  return convertedAmount
}

export const convertCurrencyFromExchangeRates = (
  exchangeRates: { [string]: string },
  fromCurrencyCode: string,
  toCurrencyCode: string,
  amount: string
): string => {
  const rateKey = `${fromCurrencyCode}_${toCurrencyCode}`
  if (!exchangeRates || exchangeRates[rateKey] == null) return '0' // handle case of exchange rates not ready yet
  const rate = exchangeRates[rateKey]
  const convertedAmount = bns.mul(amount, rate)
  return convertedAmount
}

export const calculateWalletFiatBalanceWithoutState = (
  wallet: GuiWallet,
  currencyCode: string,
  settings: Object,
  exchangeRates: { [string]: number }
): string => {
  let fiatValue = '0' // default to zero if not calculable
  const nativeBalance = wallet.nativeBalances[currencyCode]
  if (!nativeBalance || nativeBalance === '0') return '0'
  const denominations = settings[currencyCode].denominations
  const exchangeDenomination = denominations.find(denomination => denomination.name === currencyCode)
  if (!exchangeDenomination) return '0'
  const nativeToExchangeRatio: string = exchangeDenomination.multiplier
  const cryptoAmount = convertNativeToExchange(nativeToExchangeRatio)(nativeBalance)
  fiatValue = convertCurrencyWithoutState(exchangeRatesToString(exchangeRates), currencyCode, wallet.isoFiatCurrencyCode, cryptoAmount)
  return formatNumber(fiatValue, { toFixed: 2 }) || '0'
}

export const calculateWalletFiatBalanceUsingDefaultIsoFiat = (
  wallet: GuiWallet,
  currencyCode: string,
  settings: Object,
  exchangeRates: { [string]: number }
): string => {
  const nativeBalance = wallet.nativeBalances[currencyCode]
  if (!settings[currencyCode]) return '0'
  const denominations = settings[currencyCode].denominations
  if (!nativeBalance || nativeBalance === '0' || !denominations) return '0'
  const exchangeDenomination = denominations.find(denomination => denomination.name === currencyCode)
  if (!exchangeDenomination) return '0'
  const nativeToExchangeRatio: string = exchangeDenomination.multiplier
  const cryptoAmount = convertNativeToExchange(nativeToExchangeRatio)(nativeBalance)
  return convertCurrencyWithoutState(exchangeRatesToString(exchangeRates), currencyCode, settings.defaultIsoFiat, cryptoAmount) || '0'
}

export const convertNativeToExchangeRateDenomination = (settings: Object, currencyCode: string, nativeAmount: string): string => {
  const denominations = settings[currencyCode].denominations
  const exchangeDenomination = denominations.find(denomination => denomination.name === currencyCode)
  if (!exchangeDenomination || !nativeAmount || nativeAmount === '0') return '0'
  const nativeToExchangeRatio: string = exchangeDenomination.multiplier
  return convertNativeToExchange(nativeToExchangeRatio)(nativeAmount)
}

export const findWalletByFioAddress = async (state: RootState, fioAddress: string): Promise<EdgeCurrencyWallet | null> => {
  const fioWallets: EdgeCurrencyWallet[] = state.ui.wallets.fioWallets

  if (fioWallets && fioWallets.length) {
    for (const wallet: EdgeCurrencyWallet of fioWallets) {
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

export const exchangeRatesToString = (exchangeRates: { [string]: number }): { [string]: string } => {
  const exchangeRateString = {}
  for (const rate in exchangeRates) {
    exchangeRateString[rate] = `${exchangeRates[rate]}`
  }
  return exchangeRateString
}
