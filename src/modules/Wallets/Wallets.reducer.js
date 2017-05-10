// Do not send actions to this reducer
// Only the core should send actions to this reducer

import { ACTION } from './Wallets.action'

const initialState = {
  byId: {},
  activeWalletIds: [],
  archivedWalletIds: []
}

const wallets = (state = initialState, action) => {
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
      return {...state, wallet}

    default:
      return state
  }
}

const activeWalletIds = (state, action) => {
  let walletId
  switch (action.type) {
    case ACTION.ARCHIVE_WALLET:
      walletId = action.data.walletId
      return getNewArrayWithoutItem(state, walletId)

    case ACTION.ADD_WALLET:
      walletId = action.data.wallet.walletId
      return getNewArrayWithItem(state, walletId)

    case ACTION.DE_ARCHIVE_WALLET:
      walletId = action.data.walletId
      return getNewArrayWithItem(state, walletId)

    default:
      return state
  }
}

const archivedWalletIds = (state, action) => {
  let walletId
  switch (action.type) {
    case ACTION.ARCHIVE_WALLET:
      walletId = action.data.walletId
      return getNewArrayWithItem(state, walletId)

    case ACTION.DE_ARCHIVE_WALLET:
      walletId = action.data.walletId
      return getNewArrayWithoutItem(state, walletId)

    default:
      return state
  }
}

const schema = (wallet) => {
  walletId = wallet.walletId
  walletType = wallet.walletType
  walletName = wallet.walletName

  newWallet = {
    [walletId]: {
      walletId,
      walletType,
      walletName
    }
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
