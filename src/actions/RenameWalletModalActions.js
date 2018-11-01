// @flow

export type OpenRenameWalletModalAction = {
  type: 'OPEN_RENAME_WALLET_MODAL',
  data: { walletId: string }
}

export type CloseRenameWalletModalAction = {
  type: 'CLOSE_RENAME_WALLET_MODAL'
}

export type RenameWalletModalAction = OpenRenameWalletModalAction | CloseRenameWalletModalAction
