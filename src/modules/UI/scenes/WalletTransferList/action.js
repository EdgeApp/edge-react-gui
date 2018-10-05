// @flow

export const updateWalletTransferList = (data: any) => ({
  type: 'UPDATE_WALLET_TRANSFER_LIST',
  data
})

export const toggleWalletListModal = () => ({
  type: 'TOGGLE_WALLET_LIST_MODAL_VISIBILITY'
})
