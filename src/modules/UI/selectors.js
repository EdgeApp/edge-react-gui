// UI/selectors
// @flow

import type {AbcTransaction} from 'airbitz-core-types'

import type {State} from '../ReduxTypes'
import type {GuiDenomination, GuiWallet} from '../../types'

export const getWallets = (state: State) => { // returns an object with GUI Wallets as Keys Not sure how to tpye that
  const wallets = state.ui.wallets.byId
  return wallets
}

export const getWallet = (state: State, walletId: string) => {
  const wallets = getWallets(state)
  const wallet = wallets[walletId]
  return wallet
}

export const getSelectedWalletId = (state: State): string  => {
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

export const getTransactions = (state: State): Array<AbcTransaction> => {
  const transactions = state.ui.scenes.transactionList.transactions
  return transactions
}

export const getDenominations = (state: State, currencyCode: string) => {
  const wallet = getSelectedWallet(state)
  const denominations = Object.values(wallet.allDenominations[currencyCode])
  return denominations
}

export const getExchangeDenomination = (state: State, currencyCode: string, specificWallet?: GuiWallet): GuiDenomination => {
  let wallet = getSelectedWallet(state)
  if (specificWallet) {
    wallet = getWallet(state, specificWallet.id)
  }
  for (const key of Object.keys(wallet.allDenominations[currencyCode])) {
    const denomination = wallet.allDenominations[currencyCode][key]
    if (denomination.name === currencyCode) return denomination
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

export const getDropdownAlertState = (state: State): {displayAlert: boolean, message: string} => {
  const dropdownAlertState = getUIState(state).dropdownAlert
  return dropdownAlertState
}
