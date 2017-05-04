export const UPDATE_WALLET_LIST_ORDER = 'UPDATE_WALLET_LIST_ORDER'
export const UPDATE_ARCHIVE_LIST_ORDER = 'UPDATE_ARCHIVE_LIST_ORDER'
export const TOGGLE_ARCHIVE_VISIBILITY = 'TOGGLE_ARCHIVE_VISIBILITY'
export const TOGGLE_WALLETS_ARCHIVE_VISIBILITY = 'TOGGLE_WALLETS_ARCHIVE_VISIBILITY'
export const TOGGLE_RENAME_WALLET_MODAL = 'TOGGLE_RENAME_WALLET_MODAL'
export const START_DELETE_WALLET = 'START_DELETE WALLET'
export const UPDATE_WALLET_RENAME_INPUT = 'UPDATE_WALLET_RENAME_INPUT'
export const UPDATE_WALLET_ORDER = 'UPDATE_WALLET_ORDER'
export const TOGGLE_ARCHIVE_WALLET = 'TOGGLE_ARCHIVE_WALLET'

export function updateWalletOrder(walletOrder) {
  return {
    type: UPDATE_WALLET_ORDER,
    data: walletOrder
  }
}

export function updateWalletListOrder (order, list, listArray) {
  const walletOrder = order
  const walletList = list
  const walletOrderWithIds = []
  const newWalletList = {}
  var iterator = 0

  for (let prop of order) {
    newWalletList[listArray[prop].id] = listArray[prop] //.push(list[parseInt(prop)].id)
    newWalletList[listArray[prop].id].order = prop
    //newWalletList[prop].order = iterator
    iterator++
  }  
  let data = newWalletList
  return {
    type: UPDATE_WALLET_LIST_ORDER,
    data
  }
}

export function executeWalletRowOption(walletKey, optionKey) {
  if(optionKey === 'Delete') {
    type = START_DELETE_WALLET
  } else if (optionKey === 'Rename') {
    type = TOGGLE_RENAME_WALLET_MODAL
  } else if (optionKey === 'Archive' || optionKey === 'Restore') {
    type = TOGGLE_ARCHIVE_WALLET
  }
  data = walletKey

  return {
    type,
    data
  }
}

export function toggleWalletRenameModal() {
  return {
    type: TOGGLE_RENAME_WALLET_MODAL
  }
}

export function updateArchiveListOrder (data) {
  return {
    type: UPDATE_ARCHIVE_LIST_ORDER,
    data
  }
}

export function updateWalletRenameInput(data) {
  return {
    type: UPDATE_WALLET_RENAME_INPUT,
    data
  }
}

export function toggleArchiveVisibility() {
  return {
    type: TOGGLE_WALLETS_ARCHIVE_VISIBILITY
  }
}