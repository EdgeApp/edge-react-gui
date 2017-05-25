// Do not send actions to this reducer
// Only the core should send actions to this reducer

import * as ACTION from './action.js'

const initialState = {
  byId: {}
}

export const wallets = (state = initialState, action) => {
  return {
    byId: byId(state.byId, action)
  }
}

const byId = (state, action) => {
  switch (action.type) {
    case ACTION.ADD_WALLET:
      const wallet = action.data.wallet
      return {
        ...state,
        [wallet.id]: wallet
      }

    default:
      return state
  }
}
