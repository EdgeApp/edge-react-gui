// @flow

import type {State} from '../../../ReduxTypes'

export const getIsScanToWalletListModalVisibile = (state: State) => {
  return state.ui.scenes.scan.scanToWalletListModalVisibility
}

export const getIsTorchEnabled = (state: State) => {
  return state.ui.scenes.scan.torchEnabled
}
export const getIsScanEnabled = (state: State) => {
  return state.ui.scenes.scan.scanEnabled
}

export const getAddressModalVisible = (state: State) => {
  return state.ui.scenes.scan.addressModalVisible
}
