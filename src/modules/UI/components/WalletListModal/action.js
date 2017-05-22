export const TOGGLE_WALLET_LIST_MODAL_VISIBILITY = 'TOGGLE_WALLET_LIST_MODAL_VISIBILITY'
export const ENABLE_WALLET_LIST_MODAL_VISIBILITY = 'ENABLE_WALLET_LIST_MODAL_VISIBILITY'
export const DISABLE_WALLET_LIST_MODAL_VISIBILITY = 'DISABLE_WALLET_LIST_MODAL_VISIBILITY'


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