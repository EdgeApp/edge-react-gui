// @flow
import { Actions } from 'react-native-router-flux'

import { getSelectedWalletId } from '../modules/UI/selectors.js'
import type { Dispatch, GetState } from '../types/reduxTypes.js'

export const updateCurrentSceneKey = (sceneKey: string) => ({
  type: 'UPDATE_CURRENT_SCENE_KEY',
  data: { sceneKey }
})

export const openDrawer = () => (dispatch: Dispatch, getState: GetState) => {
  const state = getState()
  const selectedWallet = getSelectedWalletId(state)
  if (selectedWallet.length > 0 && Actions.currentScene !== 'DrawerOpen') {
    Actions.drawerOpen()
  }
}
