// @flow

import type {State} from '../../../ReduxTypes'

export const getDisplayAlert = (state: State) => {
  return state.ui.errorAlert.displayAlert
}

export const getMessage = (state: State) => {
  return state.ui.errorAlert.message
}
