// @flow

import type {State} from '../../../ReduxTypes'

export const getUsersView = (state: State) => {
  return state.ui.scenes.controlPanel.usersView
}
