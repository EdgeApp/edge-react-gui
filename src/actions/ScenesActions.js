// @flow
import { Actions } from 'react-native-router-flux'

import type { Dispatch, GetState } from '../types/reduxTypes.js'

export const openDrawer = () => (dispatch: Dispatch, getState: GetState) => {
  const state = getState()
  const selectedWallet = state.ui.wallets.selectedWalletId
  if (selectedWallet.length > 0 && Actions.currentScene !== 'DrawerOpen') {
    Actions.drawerOpen()
  }
}
