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
  const { type, data } = action
  switch (type) {
    case ACTION.ADD_WALLET:
      const wallet = data.wallet
      return {
        ...state,
        [wallet.id]: wallet
      }

    case ACTION.ARCHIVE_WALLET:
    case ACTION.DELETE_WALLET:
      const { walletId } = data
      const newState = Object.assign({}, state)
      delete newState[walletId]
      return newState

    default:
      return state
  }
}
