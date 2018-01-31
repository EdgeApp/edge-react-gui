// @flow

import type {State} from '../../../ReduxTypes'

export const getHelpModal = (state: State) => {
  return state.ui.scenes.helpModal
}
