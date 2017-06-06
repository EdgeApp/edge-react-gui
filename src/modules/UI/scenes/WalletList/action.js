export const UPDATE_WALLET_LIST_ORDER = 'UPDATE_WALLET_LIST_ORDER'
export const UPDATE_ARCHIVE_LIST_ORDER = 'UPDATE_ARCHIVE_LIST_ORDER'
export const TOGGLE_ARCHIVE_VISIBILITY = 'TOGGLE_ARCHIVE_VISIBILITY'
export const TOGGLE_WALLETS_ARCHIVE_VISIBILITY = 'TOGGLE_WALLETS_ARCHIVE_VISIBILITY'
export const TOGGLE_RENAME_WALLET_MODAL = 'TOGGLE_RENAME_WALLET_MODAL'
export const OPEN_RENAME_WALLET_MODAL = 'OPEN_RENAME_WALLET_MODAL'
export const START_DELETE_WALLET = 'START_DELETE WALLET'
export const UPDATE_WALLET_RENAME_INPUT = 'UPDATE_WALLET_RENAME_INPUT'
export const UPDATE_WALLET_ORDER = 'UPDATE_WALLET_ORDER'
export const TOGGLE_ARCHIVE_WALLET = 'TOGGLE_ARCHIVE_WALLET'
export const COMPLETE_RENAME_WALLET = 'COMPLETE_RENAME_WALLET'
export const CLOSE_DELETE_WALLET_MODAL = 'CLOSE_DELETE_WALLET_MODAL'
export const UPDATE_CURRENT_RENAME_WALLET = 'UPDATE_CURRENT_RENAME_WALLET'
export const CLOSE_RENAME_WALLET_MODAL = 'CLOSE_RENAME_WALLET_MODAL'

export function updateWalletOrder (walletOrder) {
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
    newWalletList[listArray[prop].id] = listArray[prop] // .push(list[parseInt(prop)].id)
    newWalletList[listArray[prop].id].order = prop
    // newWalletList[prop].order = iterator
    iterator++
  }
  let data = newWalletList
  return {
    type: UPDATE_WALLET_LIST_ORDER,
    data
  }
}

export function executeWalletRowOption (key, optionKey, wallets) {
  console.info('inside action.executeWalletRowOption and arguments are: ', key, optionKey, wallets)
  let data = null
  if (optionKey === 'Delete') {
    type = START_DELETE_WALLET
    let currentName = wallets[key].name
    data = {key, currentName}
  } else if (optionKey === 'Rename') {
    type = OPEN_RENAME_WALLET_MODAL
    // will have to eventually use real name!
    let currentName = wallets[key].id.slice(0, 5)
    data = {key, currentName}
  } else if (optionKey === 'Archive' || optionKey === 'Restore') {
    type = TOGGLE_ARCHIVE_WALLET
    data = {key}
  }

  return {
    type,
    data
  }
}

export function toggleWalletRenameModal () {
  return {
    type: TOGGLE_RENAME_WALLET_MODAL

  }
}

export function closeWalletRenameModal () {
  return {
    type: CLOSE_RENAME_WALLET_MODAL
  }
}

export function updateCurrentWalletBeingRenamed (key) {
  if (!key) key = null
  return {
    type: UPDATE_CURRENT_RENAME_WALLET,
    key
  }
}

export function updateArchiveListOrder (data) {
  return {
    type: UPDATE_ARCHIVE_LIST_ORDER,
    data
  }
}

export function updateWalletRenameInput (data) {
  return {
    type: UPDATE_WALLET_RENAME_INPUT,
    data
  }
}

export function completeRenameWallet (key, input) {
  return {
    type: COMPLETE_RENAME_WALLET,
    key,
    input
  }
}

export function toggleArchiveVisibility () {
  return {
    type: TOGGLE_WALLETS_ARCHIVE_VISIBILITY
  }
}

export function closeWalletDeleteModal () {
  return {
    type: CLOSE_DELETE_WALLET_MODAL
  }
}
