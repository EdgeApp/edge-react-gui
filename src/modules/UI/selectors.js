// @flow

import _ from 'lodash'

import type { GuiDenomination, GuiWallet, TransactionListTx } from '../../types'
import type { State } from '../ReduxTypes'
import * as SETTINGS_SELECTORS from './Settings/selectors'

export const getWallets = (state: State) => {
  // returns an object with GUI Wallets as Keys Not sure how to tpye that
  const wallets = state.ui.wallets.byId
  return wallets
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

export const getTransactions = (state: State): Array<TransactionListTx> => {
  const transactions = state.ui.scenes.transactionList.transactions
  return transactions
}

export const getDenominations = (state: State, currencyCode: string) => {
  const wallet = getSelectedWallet(state)
  const denominations = Object.values(wallet.allDenominations[currencyCode])
  return denominations
}

// $FlowFixMe
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
