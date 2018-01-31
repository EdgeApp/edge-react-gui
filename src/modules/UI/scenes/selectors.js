// @flow

import type {State} from '../../ReduxTypes'

export const getScanScene = (state: State) => {
  return state.ui.scenes.scan
}

export const getSendConfirmation = (state: State) => {
  return state.ui.scenes.sendConfirmation
}

export const getTransactionList = (state: State) => {
  return state.ui.scenes.transactionList
}

export const getTransactionDetails = (state: State) => {
  return state.ui.scenes.transactionDetails
}

export const getControlPanel = (state: State) => {
  return state.ui.scenes.controlPanel
}

export const getWalletList = (state: State) => {
  return state.ui.scenes.walletList
}

export const getWalletTransferList = (state: State) => {
  return state.ui.scenes.walletTransferList
}

export const getSideMenu = (state: State) => {
  return state.ui.scenes.sideMenu
}

export const getCreateWallet = (state: State) => {
  return state.ui.scenes.createWallet
}

export const getEditToken = (state: State) => {
  return state.ui.scenes.editToken
}

export const getRequest = (state: State) => {
  return state.ui.scenes.request
}

export const getDimensions = (state: State) => {
  return state.ui.scenes.dimensions
}

export const getHelpModal = (state: State) => {
  return state.ui.scenes.helpModal
}

export const getTransactionAlert = (state: State) => {
  return state.ui.scenes.transactionAlert
}

export const getExchangeRate = (state: State) => {
  return state.ui.scenes.exchangeRate
}

export const getABAlert = (state: State) => {
  return state.ui.scenes.ABAlert
}
