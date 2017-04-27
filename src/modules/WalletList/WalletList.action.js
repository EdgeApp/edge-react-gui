export const UPDATE_WALLET_LIST_ORDER = 'UPDATE_WALLET_LIST_ORDER'
export const UPDATE_ARCHIVE_LIST_ORDER = 'UPDATE_ARCHIVE_LIST_ORDER'
export const TOGGLE_WALLETS_VISIBILITY = 'TOGGLE_WALLETS_VISIBILITY'
export const TOGGLE_ARCHIVE_VISIBILITY = 'TOGGLE_ARCHIVE_VISIBILITY'
export const UPDATE_WALLETS_ARCHIVE_VISIBILITY = 'UPDATE_WALLETS_ARCHIVE_VISIBILITY'
export const START_RENAME_WALLET = 'START_RENAME_WALLET'
export const START_DELETE_WALLET = 'START_DELETE WALLET'

export function updateWalletListOrder (data) {
  return {
    type: UPDATE_WALLET_LIST_ORDER,
    data
  }
}

export function executeWalletRowOption(walletKey, optionKey) {
  if(optionKey === 'Delete') {
    type = START_DELETE_WALLET
  } else if (optionKey === 'Rename') {
    type = START_RENAME_WALLET
  }
  data = walletKey

  return {
    type,
    data
  }
}

export function updateArchiveListOrder (data) {
  return {
    type: UPDATE_ARCHIVE_LIST_ORDER,
    data
  }
}

export function toggleWalletsVisibility(currentWalletsVisibility, currentArchiveVisibility) {
  if(currentWalletsVisibility && currentArchiveVisibility){ //both true
    walletsVisibility = !currentWalletsVisibility
    archiveVisibility = currentArchiveVisibility
  }else if(currentWalletsVisibility && !currentArchiveVisibility) { //only wallets currently visible
    walletsVisibility = !currentWalletsVisibility
    archiveVisibility = currentArchiveVisibility
  } else if(!currentWalletsVisibility && currentArchiveVisibility) { //only archive currently visible
    walletsVisibility = !currentWalletsVisibility
    archiveVisibility = !currentArchiveVisibility
  } else if(!currentWalletsVisibility && !currentArchiveVisibility) { //both false
    walletsVisibility = !currentWalletsVisibility
    archiveVisibility = currentArchiveVisibility
  }
  return {
    type: UPDATE_WALLETS_ARCHIVE_VISIBILITY,
    walletsVisibility,
    archiveVisibility
  }
}

export function toggleArchiveVisibility(currentArchiveVisibility, currentWalletsVisibility) {
  if(currentWalletsVisibility && currentArchiveVisibility){ //both true
    walletsVisibility = currentWalletsVisibility
    archiveVisibility = !currentArchiveVisibility
  }else if(currentWalletsVisibility && !currentArchiveVisibility) { //only wallets currently visible
    walletsVisibility = !currentWalletsVisibility
    archiveVisibility = !currentArchiveVisibility
  } else if(!currentWalletsVisibility && currentArchiveVisibility) { //only archive currently visible
    walletsVisibility = currentWalletsVisibility
    archiveVisibility = !currentArchiveVisibility
  } else if(!currentWalletsVisibility && !currentArchiveVisibility) { //both false
    walletsVisibility = currentWalletsVisibility
    archiveVisibility = !currentArchiveVisibility
  }  

  return {
    type: UPDATE_WALLETS_ARCHIVE_VISIBILITY,
    archiveVisibility,
    walletsVisibility
  }
}