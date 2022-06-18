// @flow
import type { Dispatch, GetState } from '../types/reduxTypes.js'
import { type NavigationProp, type ParamList } from '../types/routerTypes.js'

export const openDrawer =
  <Name: $Keys<ParamList>>(navigation: NavigationProp<Name>) =>
  (dispatch: Dispatch, getState: GetState) => {
    const state = getState()
    const selectedWallet = state.ui.wallets.selectedWalletId
    if (selectedWallet.length > 0 && navigation.currentScene !== 'DrawerOpen') {
      navigation.openDrawer()
    }
  }
