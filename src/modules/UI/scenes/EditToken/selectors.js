// @flow

import type {State} from '../../../ReduxTypes'

export const getDeleteTokenModalVisible = (state: State) => {
  return state.ui.scenes.editToken.deleteTokenModalVisible
}

export const getDeleteCustomTokenProcessing = (state: State) => {
  return state.ui.scenes.editToken.deleteCustomTokenProcessing
}

export const getEditCustomTokenProcessing = (state: State) => {
  return state.ui.scenes.editToken.editCustomTokenProcessing
}
