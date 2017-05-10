// Do not send actions to this reducer
// Only the core should send actions to this reducer

import * as ACTION from './Wallets.action.js'

const initialState = {
  byId: {},
  activeWalletIds: [],
  archivedWalletIds: []
}

export const wallets = (state = initialState, action) => {
  return {
    byId: byId(state.byId, action),
    activeWalletIds: activeWalletIds(state.activeWalletIds, action),
    archivedWalletIds: archivedWalletIds(state.archivedWalletIds, action)
  }
}

const byId = (state, action) => {
  switch (action.type) {
    case ACTION.ADD_WALLET:
      const wallet = schema(action.data.wallet)
      newState = {
        ...state,
        [wallet.id]: wallet
      }

      return newState

    default:
      return state
  }
}

const activeWalletIds = (state, action) => {
  let id
  switch (action.type) {
    case ACTION.ARCHIVE_WALLET:
      id = action.data.id
      return getNewArrayWithoutItem(state, id)

    case ACTION.ADD_WALLET:
      id = action.data.wallet.id
      return getNewArrayWithItem(state, id)

    case ACTION.DE_ARCHIVE_WALLET:
      id = action.data.id
      return getNewArrayWithItem(state, id)

    default:
      return state
  }
}

const archivedWalletIds = (state, action) => {
  let id
  switch (action.type) {
    case ACTION.ARCHIVE_WALLET:
      id = action.data.id
      return getNewArrayWithItem(state, id)

    case ACTION.DE_ARCHIVE_WALLET:
      id = action.data.id
      return getNewArrayWithoutItem(state, id)

    default:
      return state
  }
}

const schema = (wallet) => {
  id = wallet.id
  type = wallet.type
  name = wallet.name

  newWallet = {
    id,
    type,
    name
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
