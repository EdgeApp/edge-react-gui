// @flow
import type { Dispatch, GetState } from '../types/reduxTypes.js'
import { type NavigationProp, useNavigation } from '../types/routerTypes.js'

export const openDrawer = () => (dispatch: Dispatch, getState: GetState) => {
  const state = getState()

  const navigation: NavigationProp<'edge'> = useNavigation()
  const selectedWallet = state.ui.wallets.selectedWalletId
  if (selectedWallet.length > 0 && navigation.currentScene !== 'DrawerOpen') {
    navigation.openDrawer()
  }
}
