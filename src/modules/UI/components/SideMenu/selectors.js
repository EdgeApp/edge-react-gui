// @flow

import type {State} from '../../../ReduxTypes'

export const getView = (state: State) => {
  return state.ui.scenes.sideMenu.view
}
