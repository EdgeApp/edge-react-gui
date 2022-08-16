// @flow
import type { Dispatch, GetState } from '../types/reduxTypes.js'
import { type NavigationProp } from '../types/routerTypes.js'

export const openDrawer = (navigation: NavigationProp<any>) => (dispatch: Dispatch, getState: GetState) => {
  const state = getState()

  const selectedWallet = state.ui.wallets.selectedWalletId
  if (selectedWallet.length > 0) {
    navigation.openDrawer()
  }
}
