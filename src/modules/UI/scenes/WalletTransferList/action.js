/* eslint-disable flowtype/require-valid-file-annotation */

export const UPDATE_WALLET_TRANSFER_LIST = 'UPDATE_WALLET_TRANSFER_LIST'
export const TOGGLE_WALLET_LIST_MODAL_VISIBILITY = 'TOGGLE_WALLET_LIST_MODAL_VISIBILITY'

export function updateWalletTransferList (data) {
  return {
    type: UPDATE_WALLET_TRANSFER_LIST,
    data
  }
}

export function toggleWalletListModal () {
  return {
    type: TOGGLE_WALLET_LIST_MODAL_VISIBILITY
  }
}
