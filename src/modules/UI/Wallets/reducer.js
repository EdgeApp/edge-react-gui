import { combineReducers } from 'redux'
import * as ACTION from './action'

export const byId = (state = {}, action) => {
  const { type, data = {} } = action
  switch (type) {
    case ACTION.UPSERT_WALLET:
      return {
        ...state,
        [data.wallet.id]: schema(data.wallet)
      }

    case ACTION.DELETE_WALLET: {
      const { walletId } = data
      const newState = Object.assign({}, state)
      delete newState[walletId]
      return newState
    }

    default:
      return state
  }
}

export const activeWalletIds = (state = [], action) => {
  const { type, data = {} } = action
  const { wallet } = data
  switch (type) {
    case ACTION.UPSERT_WALLET:
      if (!wallet.archived) {
        return getNewArrayWithItem(state, wallet.id)
      }
      return getNewArrayWithoutItem(state, wallet.id)
    default:
      return state
  }
}

export const archivedWalletIds = (state = [], action) => {
  const { type, data = {} } = action
  const { wallet } = data
  switch (type) {
    case ACTION.UPSERT_WALLET:
      if (!wallet.archived || wallet.deleted) {
        return getNewArrayWithoutItem(state, wallet.id)
      }
      return getNewArrayWithItem(state, wallet.id)
    default:
      return state
  }
}

export const selectedWalletId = (state = '', action) => {
  const { type, data = {} } = action
  const { walletId } = data

  switch (type) {
    case ACTION.SELECT_WALLET_ID:
      return walletId
    default:
      return state
  }
}

const schema = wallet => {
  const id = wallet.id
  const type = wallet.type
  const name = wallet.name
  const sortIndex = wallet.sortIndex
  const archived = wallet.archived
  const deleted = wallet.deleted

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
    metaTokens,
    sortIndex,
    archived,
    deleted
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

export const wallets = combineReducers({
  byId,
  activeWalletIds,
  archivedWalletIds,
  selectedWalletId
})
