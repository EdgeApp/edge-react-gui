export const TOGGLE_WALLET_LIST_MODAL_VISIBILITY = 'TOGGLE_WALLET_LIST_MODAL_VISIBILITY'
export const ENABLE_WALLET_LIST_MODAL_VISIBILITY = 'ENABLE_WALLET_LIST_MODAL_VISIBILITY'
export const DISABLE_WALLET_LIST_MODAL_VISIBILITY = 'DISABLE_WALLET_LIST_MODAL_VISIBILITY'

export const TOGGLE_SELECTED_WALLET_LIST_MODAL = 'TOGGLE_SELECTED_WALLET_LIST_MODAL'
export const ENABLE_SELECTED_WALLET_LIST_MODAL = 'ENABLE_SELECTED_WALLET_LIST_MODAL'
export const DISABLE_SELECTED_WALLET_LIST_MODAL = 'DISABLE_SELECTED_WALLET_LIST_MODAL'

export const TOGGLE_SCAN_TO_WALLET_LIST_MODAL = 'TOGGLE_SCAN_TO_WALLET_LIST_MODAL'
export const ENABLE_SCAN_TO_WALLET_LIST_MODAL = 'ENABLE_SCAN_TO_WALLET_LIST_MODAL'
export const DISABLE_SCAN_TO_WALLET_LIST_MODAL = 'DISABLE_SCAN_TO_WALLET_LIST_MODAL'

export const TOGGLE_TRANSACTIONS_WALLET_LIST_MODAL = 'TOGGLE_TRANSACTIONS_WALLET_LIST_MODAL' // same as TOGGLE_SELECTED_WALLET_LIST_MODAL ?
export const ENABLE_TRANSACTIONS_WALLET_LIST_MODAL = 'ENABLE_TRANSACTIONS_WALLET_LIST_MODAL'
export const DISABLE_TRANSACTIONS_WALLET_LIST_MODAL = 'DISABLE_TRANSACTIONS_WALLET_LIST_MODAL'

// //////////// begin selected wallet //////////////
export const toggleSelectedWalletListModal = () => {
  return {
    type: TOGGLE_SELECTED_WALLET_LIST_MODAL
  }
}

export const enableSelectedWalletListModal = () => {
  return {
    type: ENABLE_SELECTED_WALLET_LIST_MODAL
  }
}

export const disableSelectedWalletListModal = () => {
  return {
    type: DISABLE_SELECTED_WALLET_LIST_MODAL
  }
}
// ///////////// end selected wallet //////////////

// ///////////// begin toggleScaneTo wallet ////////////
export const toggleScanToWalletListModal = () => {
  return {
    type: TOGGLE_SCAN_TO_WALLET_LIST_MODAL
  }
}
export const enableScanToWalletListModal = () => {
  return {
    type: ENABLE_SCAN_TO_WALLET_LIST_MODAL
  }
}
export const disableScanToWalletListModal = () => {
  return {
    type: DISABLE_SCAN_TO_WALLET_LIST_MODAL
  }
}
// ///////////// end toggleScaneTo wallet ////////////

// ///////// begin wallet list modal visibility ///////////
export const toggleWalletListModalVisibility = () => {
  return {
    type: TOGGLE_WALLET_LIST_MODAL_VISIBILITY
  }
}

export const enableWalletListModalVisibility = () => {
  return {
    type: ENABLE_WALLET_LIST_MODAL_VISIBILITY
  }
}

export const disableWalletListModalVisibility = () => {
  return {
    type: DISABLE_WALLET_LIST_MODAL_VISIBILITY
  }
}
// ///////// end wallet list modal visibility ///////////

// //////// start transactionList wallet modal (same as selected wallet?) ///////////////

export const toggleTransactionsWalletListModal = () => {
  return {
    type: TOGGLE_TRANSACTIONS_WALLET_LIST_MODAL
  }
}
export const enableTransactionsWalletListModal = () => {
  return {
    type: ENABLE_TRANSACTIONS_WALLET_LIST_MODAL
  }
}
export const disableTransactionsWalletListModal = () => {
  return {
    type: DISABLE_TRANSACTIONS_WALLET_LIST_MODAL
  }
}
// ///////// start transactionList wallet modal (same as selected wallet?) ///////////////

// ///// was going to attempt to loop through but Javascript isn't great with dynamic variable names (for functions and constants)
