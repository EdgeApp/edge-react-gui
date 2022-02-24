// @flow

import { mul } from 'biggystring'
import { type EdgeCurrencyWallet, type EdgeDenomination } from 'edge-core-js'

import { FIAT_PRECISION } from '../constants/WalletAndCurrencyConstants.js'
import { formatNumber } from '../locales/intl.js'
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
  const convertedAmount = mul(amount, exchangeRate)
  return convertedAmount
}

export const convertCurrencyFromExchangeRates = (
  exchangeRates: { [string]: string },
  fromCurrencyCode: string,
  toCurrencyCode: string,
  amount: string
): string => {
  const rateKey = `${fromCurrencyCode}_${toCurrencyCode}`
  const rate = exchangeRates[rateKey] ?? '0'
  const convertedAmount = mul(amount, rate)
  return convertedAmount
}

export const calculateFiatBalance = (wallet: EdgeCurrencyWallet, exchangeDenomination: EdgeDenomination, exchangeRates: { [string]: string }): string => {
  const currencyCode = exchangeDenomination.name
  const nativeBalance = wallet.balances[currencyCode] ?? '0'
  if (zeroString(nativeBalance)) return '0'
  const nativeToExchangeRatio: string = exchangeDenomination.multiplier
  const cryptoAmount = convertNativeToExchange(nativeToExchangeRatio)(nativeBalance)
  const { isoFiatCurrencyCode } = getWalletFiat(wallet)
  const fiatValue = convertCurrencyFromExchangeRates(exchangeRates, currencyCode, isoFiatCurrencyCode, cryptoAmount)
  return formatNumber(fiatValue, { toFixed: FIAT_PRECISION }) || '0'
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
