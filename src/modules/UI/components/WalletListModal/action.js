export const TOGGLE_WALLET_LIST_MODAL_VISIBILITY = 'TOGGLE_WALLET_LIST_MODAL_VISIBILITY'
export const ENABLE_WALLET_LIST_MODAL_VISIBILITY = 'ENABLE_WALLET_LIST_MODAL_VISIBILITY'
export const DISABLE_WALLET_LIST_MODAL_VISIBILITY = 'DISABLE_WALLET_LIST_MODAL_VISIBILITY'
export const TOGGLE_SCAN_FROM_WALLET_LIST_MODAL = 'TOGGLE_SCAN_FROM_WALLET_LIST_MODAL'
export const TOGGLE_SCAN_TO_WALLET_LIST_MODAL = 'TOGGLE_SCAN_TO_WALLET_LIST_MODAL'

export function toggleScanFromWalletListModal () {
  return {
    type: TOGGLE_SCAN_FROM_WALLET_LIST_MODAL
  }
}

export function toggleScanToWalletListModal () {
  return {
    type: TOGGLE_SCAN_TO_WALLET_LIST_MODAL
  }
}

export function toggleWalletListModalVisibility() {
  return {
    type: TOGGLE_WALLET_LIST_MODAL_VISIBILITY
  }
}

export function enableWalletListModalVisibility() {
  return {
    type: ENABLE_WALLET_LIST_MODAL_VISIBILITY
  }
}

export function disableWalletListModalVisibility() {
  return {
    type: DISABLE_WALLET_LIST_MODAL_VISIBILITY
  }
}