// @flow

// //////////// begin selected wallet //////////////
export const toggleSelectedWalletListModal = () => ({
  type: 'TOGGLE_SELECTED_WALLET_LIST_MODAL'
})

export const enableSelectedWalletListModal = () => ({
  type: 'ENABLE_SELECTED_WALLET_LIST_MODAL'
})

export const disableSelectedWalletListModal = () => ({
  type: 'DISABLE_SELECTED_WALLET_LIST_MODAL'
})
// ///////////// end selected wallet //////////////

// ///////////// begin toggleScaneTo wallet ////////////
export const toggleScanToWalletListModal = () => ({
  type: 'TOGGLE_SCAN_TO_WALLET_LIST_MODAL'
})
export const enableScanToWalletListModal = () => ({
  type: 'ENABLE_SCAN_TO_WALLET_LIST_MODAL'
})
export const disableScanToWalletListModal = () => ({
  type: 'DISABLE_SCAN_TO_WALLET_LIST_MODAL'
})
// ///////////// end toggleScaneTo wallet ////////////

// ///////// begin wallet list modal visibility ///////////
export const toggleWalletListModalVisibility = () => ({
  type: 'TOGGLE_WALLET_LIST_MODAL_VISIBILITY'
})

export const enableWalletListModalVisibility = () => ({
  type: 'ENABLE_WALLET_LIST_MODAL_VISIBILITY'
})

export const disableWalletListModalVisibility = () => ({
  type: 'DISABLE_WALLET_LIST_MODAL_VISIBILITY'
})
// ///////// end wallet list modal visibility ///////////

// //////// start transactionList wallet modal (same as selected wallet?) ///////////////

export const toggleTransactionsWalletListModal = () => ({
  type: 'TOGGLE_TRANSACTIONS_WALLET_LIST_MODAL'
})
export const enableTransactionsWalletListModal = () => ({
  type: 'ENABLE_TRANSACTIONS_WALLET_LIST_MODAL'
})
export const disableTransactionsWalletListModal = () => ({
  type: 'DISABLE_TRANSACTIONS_WALLET_LIST_MODAL'
})
// ///////// start transactionList wallet modal (same as selected wallet?) ///////////////

// ///// was going to attempt to loop through but Javascript isn't great with dynamic variable names (for functions and constants)
