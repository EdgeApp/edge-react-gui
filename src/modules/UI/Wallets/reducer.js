import { combineReducers } from 'redux'
import * as ACTION from './action'

export const byId = (state = {}, action) => {
  const { type, data = {} } = action
  switch (type) {
    case ACTION.ADD_WALLET:
      return {
        ...state,
        [data.wallet.id]: schema(data.wallet)
      }

    case ACTION.DELETE_WALLET:
      const { walletId } = data
      const newState = Object.assign({}, state)
      delete newState[walletId]
      return newState

    default:
      return state
  }
}

export const activeWalletIds = (state = [], action) => {
  const { type, data = {} } = action
  let id
  switch (type) {
    case ACTION.ARCHIVE_WALLET:
      id = data.id
      return getNewArrayWithoutItem(state, id)

    case ACTION.ADD_WALLET:
      id = data.wallet.id
      return getNewArrayWithItem(state, id)

    case ACTION.ACTIVATE_WALLET:
      id = data.id
      return getNewArrayWithItem(state, id)

    case ACTION.DELETE_WALLET:
      id = data.id
      return getNewArrayWithoutItem(state, id)

    default:
      return state
  }
}

export const archivedWalletIds = (state = [], action) => {
  const { type, data = {} } = action
  let id
  switch (type) {
    case ACTION.ARCHIVE_WALLET:
      id = data.id
      return getNewArrayWithItem(state, id)

    case ACTION.ACTIVATE_WALLET:
      id = data.id
      return getNewArrayWithoutItem(state, id)

    case ACTION.DELETE_WALLET:
      id = data.id
      return getNewArrayWithoutItem(state, id)

    default:
      return state
  }
}

export const selectedWalletId = (state = '', action) => {
  const { type, data = {} } = action
  const { walletId } = data

  switch (type) {
    case ACTION.SELECT_WALLET_ID :
      return walletId
    default:
      return state
  }
}

const schema = wallet => {
  const id = wallet.id
  const type = wallet.type
  const name = wallet.name
  let balance = 0
  try {
    balance = wallet.getBalance()
  } catch (error) {
    console.log('error', error)
  }

  const info = wallet.currencyInfo
  const {
    currencyCode,
    denominations,
    symbolImage,
    metaTokens } = info

  const newWallet = {
    id,
    type,
    name,
    balance,
    currencyCode,
    denominations,
    symbolImage,
    metaTokens
  }

  return newWallet
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

export default wallets = combineReducers({
  byId,
  activeWalletIds,
  archivedWalletIds,
  selectedWalletId
})
