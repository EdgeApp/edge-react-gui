import { ThunkAction } from '../types/reduxTypes'
import { Actions } from '../types/routerTypes'

export function openDrawer(): ThunkAction<void> {
  return (dispatch, getState) => {
    const state = getState()
    const selectedWallet = state.ui.wallets.selectedWalletId
    // @ts-expect-error
    if (selectedWallet.length > 0 && Actions.currentScene !== 'DrawerOpen') {
      Actions.drawerOpen()
    }
  }
}
