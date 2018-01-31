// @flow

import type {State} from '../../ReduxTypes'

export const getGuiWallets = (state: State) => {
  return state.ui.wallets.byId
}

export const getAddTokenPending = (state: State) => {
  return state.ui.wallets.addTokenPending
}

export const getManageTokensPending = (state: State) => {
  return state.ui.wallets.manageTokensPending
}
