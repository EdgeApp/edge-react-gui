import { Dispatch, GetState } from '../types/reduxTypes'
import { Actions } from '../types/routerTypes'

export const openDrawer = () => (dispatch: Dispatch, getState: GetState) => {
  const state = getState()
  const selectedWallet = state.ui.wallets.selectedWalletId
  // @ts-expect-error
  if (selectedWallet.length > 0 && Actions.currentScene !== 'DrawerOpen') {
    Actions.drawerOpen()
  }
}
