// @flow

import type {State} from '../../../ReduxTypes'

export const getIsDropdownWalletListVisible = (state: State) => {
  return state.ui.scenes.walletListModal.walletListModalVisibility
}
