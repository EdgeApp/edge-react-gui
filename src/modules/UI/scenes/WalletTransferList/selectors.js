// @flow

import type {State} from '../../../ReduxTypes'

export const getWalletTransferList = (state: State) => {
  return state.ui.scenes.walletTransferList.walletTransferList
}

export const getIsWalletTransferModalVisible = (state: State) => {
  return state.ui.scenes.walletListModal.walletListModalVisibility
}
