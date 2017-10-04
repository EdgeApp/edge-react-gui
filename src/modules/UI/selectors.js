// UI/selectors
// @flow
import type {State} from '../ReduxTypes'
import type {
  GuiDenomination
} from '../../types'

export const getWallets = (state: State) => {
  const wallets = state.ui.wallets.byId
  return wallets
}

export const getWallet = (state: State, walletId: string) => {
  const wallets = getWallets(state)
  const wallet = wallets[walletId]
  return wallet
}

export const getSelectedWalletId = (state: State) => {
  const selectedWalletId = state.ui.wallets.selectedWalletId
  return selectedWalletId
}

export const getSelectedCurrencyCode = (state: State) => {
  const selectedCurrencyCode = state.ui.wallets.selectedCurrencyCode
  return selectedCurrencyCode
}

export const getSelectedWallet = (state: State) => {
  const walletId = getSelectedWalletId(state)
  const selectedWallet = getWallet(state, walletId)
  return selectedWallet
}

export const getActiveWalletIds = (state: State) => {
  const activeWalletIds = state.ui.wallets.activeWalletIds
  return activeWalletIds
}

export const getArchivedWalletIds = (state: State) => {
  const archivedWalletIds = state.ui.wallets.archivedWalletIds
  return archivedWalletIds
}

export const getTransactions = (state: State) => {
  const transactions = state.ui.scenes.transactionList.transactions
  return transactions
}

export const getDenominations = (state: State, currencyCode: string) => {
  const wallet = getSelectedWallet(state)
  const denominations = Object.values(wallet.allDenominations[currencyCode])
  return denominations
}

export const getExchangeDenomination = (state: State, currencyCode: string): GuiDenomination => {
  const wallet = getSelectedWallet(state)
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
