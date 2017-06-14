import { combineReducers } from 'redux'
import * as ACTION from './action.js'

const byId = (state = {}, action) => {
  const { type, data = {} } = action
  switch (type) {
    case ACTION.ADD_WALLET:
      const { wallet } = data
      return {
        ...state,
        [wallet.id]: wallet
      }

    case ACTION.REMOVE_WALLET:
      const { walletId } = data
      const newState = Object.assign({}, state)
      delete newState[walletId]
      return newState

    default:
      return state
  }
}

const pendingWalletIds = (state = [], action) => {
  const { type, data = {} } = action
  const { walletId } = data
  switch (type) {
    case ACTION.WALLET_UPDATE_START:
      return getNewArrayWithItem(state, walletId)
    case ACTION.WALLET_UPDATE_COMPLETE:
      return getNewArrayWithoutItem(state, walletId)
    default:
      return state
  }
}

const getNewArrayWithoutItem = (list, targetItem) => {
  return list.filter(item => {
    return item !== targetItem
  })
}

const getNewArrayWithItem = (list, item) => {
  if (!list.includes(item)) {
    return [...list, item]
  }
  return list
}

export const wallets = combineReducers({
  byId,
  pendingWalletIds
})
