// @flow

import { bns } from 'biggystring'
import { type EdgeCurrencyInfo, type EdgeCurrencyWallet } from 'edge-core-js'

import { formatNumber } from '../locales/intl.js'
import { type SettingsState } from '../reducers/scenes/SettingsReducer.js'
import { getDenominationFromCurrencyInfo } from '../selectors/DenominationSelectors.js'
import { type RootState } from '../types/reduxTypes.js'
import { type GuiWallet } from '../types/types.js'
import { getWalletFiat } from '../util/CurrencyWalletHelpers.js'
import { convertNativeToExchange, zeroString } from '../util/utils.js'

export function getSelectedWallet(state: RootState): GuiWallet {
  return state.ui.wallets.byId[state.ui.wallets.selectedWalletId]
}

export function getSelectedCurrencyWallet(state: RootState): EdgeCurrencyWallet {
  return state.core.account.currencyWallets[state.ui.wallets.selectedWalletId]
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

export const getExchangeRate = (state: RootState, fromCurrencyCode: string, toCurrencyCode: string): string => {
  const exchangeRates = state.exchangeRates
  const rateKey = `${fromCurrencyCode}_${toCurrencyCode}`
  const rate = exchangeRates[rateKey] ?? '0'
  return rate
}

export const convertCurrency = (state: RootState, fromCurrencyCode: string, toCurrencyCode: string, amount: string = '1'): string => {
  const exchangeRate = getExchangeRate(state, fromCurrencyCode, toCurrencyCode)
  const convertedAmount = bns.mul(amount, exchangeRate)
  return convertedAmount
}

const convertCurrencyWithoutState = (exchangeRates: { [string]: string }, fromCurrencyCode: string, toCurrencyCode: string, amount: string = '1'): string => {
  const rateKey = `${fromCurrencyCode}_${toCurrencyCode}`
  const exchangeRate = exchangeRates[rateKey] != null ? exchangeRates[rateKey] : '0'
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
  if (exchangeRates == null || exchangeRates[rateKey] == null) return '0' // handle case of exchange rates not ready yet
  const rate = exchangeRates[rateKey]
  const convertedAmount = bns.mul(amount, rate)
  return convertedAmount
}

export const calculateWalletFiatBalanceWithoutState = (wallet: EdgeCurrencyWallet, currencyCode: string, exchangeRates: { [string]: string }): string => {
  let fiatValue = '0' // default to zero if not calculable
  const nativeBalance = wallet.balances[currencyCode] ?? '0'
  if (zeroString(nativeBalance)) return '0'
  const exchangeDenomination = getDenominationFromCurrencyInfo(wallet.currencyInfo, currencyCode)
  if (!exchangeDenomination) return '0'
  const nativeToExchangeRatio: string = exchangeDenomination.multiplier
  const cryptoAmount = convertNativeToExchange(nativeToExchangeRatio)(nativeBalance)
  const { isoFiatCurrencyCode } = getWalletFiat(wallet)
  fiatValue = convertCurrencyWithoutState(exchangeRates, currencyCode, isoFiatCurrencyCode, cryptoAmount)
  return formatNumber(fiatValue, { toFixed: 2 }) || '0'
}

export const calculateWalletFiatBalanceUsingDefaultIsoFiat = (
  wallet: EdgeCurrencyWallet,
  currencyCode: string,
  settings: SettingsState,
  exchangeRates: { [string]: string }
): string => {
  const nativeBalance = wallet.balances[currencyCode]
  if (zeroString(nativeBalance)) return '0'
  const exchangeDenomination = getDenominationFromCurrencyInfo(wallet.currencyInfo, currencyCode)
  if (!exchangeDenomination) return '0'
  const nativeToExchangeRatio: string = exchangeDenomination.multiplier
  const cryptoAmount = convertNativeToExchange(nativeToExchangeRatio)(nativeBalance)
  return convertCurrencyWithoutState(exchangeRates, currencyCode, settings.defaultIsoFiat, cryptoAmount) || '0'
}

export const convertNativeToExchangeRateDenomination = (currencyInfo: EdgeCurrencyInfo, currencyCode: string, nativeAmount: string): string => {
  const exchangeDenomination = getDenominationFromCurrencyInfo(currencyInfo, currencyCode)
  if (!exchangeDenomination || zeroString(nativeAmount)) return '0'
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
