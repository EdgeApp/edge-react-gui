// @flow
import { Actions } from 'react-native-router-flux'

import type { Dispatch, GetState } from '../modules/ReduxTypes.js'
import { getSelectedWalletId } from '../modules/UI/selectors.js'

export const updateCurrentSceneKey = (sceneKey: string) => ({
  type: 'UPDATE_CURRENT_SCENE_KEY',
  data: { sceneKey }
})

export const openDawer = () => (dispatch: Dispatch, getState: GetState) => {
  const state = getState()
  const selectedWallet = getSelectedWalletId(state)
  if (selectedWallet.length > 0 && Actions.currentScene !== 'DrawerOpen') {
    Actions.drawerOpen()
  }
}
