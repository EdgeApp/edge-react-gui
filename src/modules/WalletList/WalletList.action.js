export const UPDATE_WALLET_LIST_ORDER = 'UPDATE_WALLET_LIST_ORDER'
export const UPDATE_ARCHIVE_LIST_ORDER = 'UPDATE_ARCHIVE_LIST_ORDER'
export const TOGGLE_ARCHIVE_VISIBILITY = 'TOGGLE_ARCHIVE_VISIBILITY'
export const TOGGLE_WALLETS_ARCHIVE_VISIBILITY = 'TOGGLE_WALLETS_ARCHIVE_VISIBILITY'
export const TOGGLE_RENAME_WALLET_MODAL = 'TOGGLE_RENAME_WALLET_MODAL'
export const START_DELETE_WALLET = 'START_DELETE WALLET'
export const UPDATE_WALLET_RENAME_INPUT = 'UPDATE_WALLET_RENAME_INPUT'
export const UPDATE_WALLET_ORDER = 'UPDATE_WALLET_ORDER'

export function updateWalletOrder(walletOrder) {
  return {
    type: UPDATE_WALLET_ORDER,
    data: walletOrder
  }
}

export function updateWalletListOrder (walletOrder, walletList) {
  return {
    type: UPDATE_WALLET_LIST_ORDER,
    data: walletList
  }
}

export function executeWalletRowOption(walletKey, optionKey) {
  if(optionKey === 'Delete') {
    type = START_DELETE_WALLET
  } else if (optionKey === 'Rename') {
    type = TOGGLE_RENAME_WALLET_MODAL
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

export function toggleArchiveVisibility(currentArchiveVisibility, currentWalletsVisibility) {
  return {
    type: TOGGLE_WALLETS_ARCHIVE_VISIBILITY
  }
}