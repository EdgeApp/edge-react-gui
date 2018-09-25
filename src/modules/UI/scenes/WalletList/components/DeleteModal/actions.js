// @flow

export type OpenDeleteWalletModalAction = {
  type: 'OPEN_DELETE_WALLET_MODAL',
  data: { walletId: string }
}

export type CloseDeleteWalletModalAction = {
  type: 'CLOSE_DELETE_WALLET_MODAL'
}

export type DeleteWalletModalAction = OpenDeleteWalletModalAction | CloseDeleteWalletModalAction
