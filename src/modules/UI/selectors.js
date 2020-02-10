// @flow

import type { EdgeCurrencyInfo, EdgeDenomination } from 'edge-core-js'
import _ from 'lodash'

import { FIO_STR } from '../../constants/WalletAndCurrencyConstants'
import { intl } from '../../locales/intl.js'
import type { State } from '../../types/reduxTypes.js'
import type { GuiDenomination, GuiWallet, TransactionListTx } from '../../types/types.js'
import { convertNativeToExchange, getCurrencyInfo } from '../../util/utils.js'
import * as SETTINGS_SELECTORS from '../Settings/selectors'

export const getWallets = (state: State) => {
  // returns an object with GUI Wallets as Keys Not sure how to tpye that
  const wallets = state.ui.wallets.byId
  return wallets
}

export const getFioWallets = (state: State) => {
  return state.ui.wallets.fioWallets
}

export const getWallet = (state: State, walletId: string) => {
  const wallets = getWallets(state)
  const wallet = wallets[walletId]
  return wallet
}

export const getSelectedWalletId = (state: State): string => {
  const selectedWalletId = state.ui.wallets.selectedWalletId
  return selectedWalletId
}

export const getSelectedCurrencyCode = (state: State): string => {
  const selectedCurrencyCode = state.ui.wallets.selectedCurrencyCode
  return selectedCurrencyCode
}

export const getSelectedWallet = (state: State) => {
  const walletId = getSelectedWalletId(state)
  const selectedWallet = getWallet(state, walletId)
  return selectedWallet
}

export const getActiveWalletIds = (state: State): Array<string> => {
  const activeWalletIds = state.ui.wallets.activeWalletIds
  return activeWalletIds
}

export const getArchivedWalletIds = (state: State): Array<string> => {
  const archivedWalletIds = state.ui.wallets.archivedWalletIds
  return archivedWalletIds
}

export const getWalletLoadingPercent = (state: State) => {
  const walletsForProgress = state.ui.wallets.walletLoadingProgress
  const walletIds = Object.keys(walletsForProgress)
  const numberOfWallets = walletIds.length
  let progressBeforeDivision = 0
  for (const walletId in walletsForProgress) {
    progressBeforeDivision += walletsForProgress[walletId]
  }
  const progressAfterDivision = progressBeforeDivision / numberOfWallets
  let progressPercentage = 0
  if (numberOfWallets > 0) {
    if (progressAfterDivision > 0.99999) {
      progressPercentage = 100
    } else {
      progressPercentage = parseInt(progressAfterDivision * 100)
    }
  }
  return progressPercentage
}

export const getSelectedWalletLoadingPercent = (state: State) => {
  const wallet = getSelectedWallet(state)
  const walletsProgress = state.ui.wallets.walletLoadingProgress
  return walletsProgress[wallet.id] ? walletsProgress[wallet.id] * 100 : 0
}

export const getTransactions = (state: State): Array<TransactionListTx> => {
  const transactions = state.ui.scenes.transactionList.transactions
  return transactions
}

export const getDenominations = (state: State, currencyCode: string) => {
  const wallet = getSelectedWallet(state)
  const denominations = Object.values(wallet.allDenominations[currencyCode])
  return denominations
}

export const getDefaultDenomination = (state: State, currencyCode: string): EdgeDenomination => {
  const plugins: Object = SETTINGS_SELECTORS.getPlugins(state)
  const allCurrencyInfos: Array<EdgeCurrencyInfo> = plugins.allCurrencyInfos
  const currencyInfo = getCurrencyInfo(allCurrencyInfos, currencyCode)
  if (currencyInfo) return currencyInfo[0]
  const settings = state.ui.settings
  const currencySettings = settings[currencyCode]
  const defaultMultiplier = currencySettings.denomination
  const denomination = _.find(currencySettings.denominations, denom => denom.multiplier === defaultMultiplier)
  if (!denomination) throw new Error('Edge: Denomination not found. Possible invalid currencyCode.')
  return denomination
}

export const getExchangeDenomination = (state: State, currencyCode: string, specificWallet?: GuiWallet): GuiDenomination => {
  let wallet = getSelectedWallet(state)
  const customTokens = SETTINGS_SELECTORS.getCustomTokens(state)
  if (specificWallet) {
    wallet = getWallet(state, specificWallet.id)
  }
  if (wallet.allDenominations[currencyCode]) {
    for (const key of Object.keys(wallet.allDenominations[currencyCode])) {
      const denomination = wallet.allDenominations[currencyCode][key]
      if (denomination.name === currencyCode) return denomination
    }
  } else {
    const customToken = _.find(customTokens, item => item.currencyCode === currencyCode)
    if (customToken && customToken.denomination && customToken.denomination[0]) {
      const denomination = customToken.denominations[0]
      return denomination
    }
  }
  throw new Error('Edge: Denomination not found. Possible invalid currencyCode.')
}

export const getUIState = (state: State) => {
  const uiState = state.ui
  return uiState
}

export const getScenesState = (state: State) => {
  const uiState = getUIState(state)
  const scenesState = uiState.scenes
  return scenesState
}

export const getSceneState = (state: State, sceneKey: string) => {
  const sceneState = getScenesState(state)[sceneKey]
  return sceneState
}

export const getExchangeRate = (state: State, fromCurrencyCode: string, toCurrencyCode: string): number => {
  if (fromCurrencyCode === FIO_STR || toCurrencyCode === FIO_STR) {
    // TODO: add real exchange rate
    return 0
  }

  const exchangeRates = state.exchangeRates
  const rateKey = `${fromCurrencyCode}_${toCurrencyCode}`
  const rate = exchangeRates[rateKey] ? exchangeRates[rateKey] : 0
  return rate
}

export const convertCurrency = (state: State, fromCurrencyCode: string, toCurrencyCode: string, amount: number = 1) => {
  const exchangeRate = getExchangeRate(state, fromCurrencyCode, toCurrencyCode)
  const convertedAmount = amount * exchangeRate
  return convertedAmount
}

export const convertCurrencyWithoutState = (exchangeRates: { [string]: number }, fromCurrencyCode: string, toCurrencyCode: string, amount: number = 1) => {
  const rateKey = `${fromCurrencyCode}_${toCurrencyCode}`
  const exchangeRate = exchangeRates[rateKey] ? exchangeRates[rateKey] : 0
  const convertedAmount = amount * exchangeRate
  return convertedAmount
}

export const convertCurrencyFromExchangeRates = (exchangeRates: { [string]: number }, fromCurrencyCode: string, toCurrencyCode: string, amount: number) => {
  if (!exchangeRates) return 0 // handle case of exchange rates not ready yet
  const rateKey = `${fromCurrencyCode}_${toCurrencyCode}`
  const rate = exchangeRates[rateKey]
  const convertedAmount = amount * rate
  return convertedAmount
}

export const calculateWalletFiatBalanceWithoutState = (wallet: GuiWallet, currencyCode: string, settings: Object, exchangeRates: { [string]: number }) => {
  let fiatValue = 0 // default to zero if not calculable
  const nativeBalance = wallet.nativeBalances[currencyCode]
  if (!nativeBalance || nativeBalance === '0') return '0'
  const denominations = settings[currencyCode].denominations
  const exchangeDenomination = denominations.find(denomination => denomination.name === currencyCode)
  if (!exchangeDenomination) return '0'
  const nativeToExchangeRatio: string = exchangeDenomination.multiplier
  const cryptoAmount: number = parseFloat(convertNativeToExchange(nativeToExchangeRatio)(nativeBalance))
  fiatValue = convertCurrencyWithoutState(exchangeRates, currencyCode, wallet.isoFiatCurrencyCode, cryptoAmount)
  return intl.formatNumber(fiatValue, { toFixed: 2 }) || '0'
}
