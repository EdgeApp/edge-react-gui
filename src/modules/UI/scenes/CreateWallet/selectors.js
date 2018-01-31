// @flow

import type {State} from '../../../ReduxTypes'

export const getIsCreatingWallet = (state: State) => {
  return state.ui.scenes.createWallet.isCreatingWallet
}
