// @flow

import type {State} from '../../../ReduxTypes'

export const getWalletName = (state: State) => {
  return state.ui.scenes.walletList.walletName
}

export const getWalletId = (state: State) => {
  return state.ui.scenes.walletList.walletId
}

export const getWalletArchiveVisible = (state: State) => {
  return state.ui.scenes.walletList.walletArchivesVisible
}

export const getRenameWalletInput = (state: State) => {
  return state.ui.scenes.walletList.renameWalletInput
}

export const getRenameWalletModalVisible = (state: State) => {
  return state.ui.scenes.walletList.renameWalletModalVisible
}
