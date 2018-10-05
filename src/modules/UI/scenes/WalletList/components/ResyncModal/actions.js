// @flow

export type OpenResyncWalletModalAction = {
  type: 'OPEN_RESYNC_WALLET_MODAL',
  data: { walletId: string }
}

export type CloseResyncWalletModalAction = {
  type: 'CLOSE_RESYNC_WALLET_MODAL'
}

export type ResyncWalletModalAction = OpenResyncWalletModalAction | CloseResyncWalletModalAction
