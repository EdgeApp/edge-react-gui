// @flow

import type {State} from '../../ReduxTypes'

export const getDimensions = (state: State) => {
  return state.ui.scenes.dimensions
}
