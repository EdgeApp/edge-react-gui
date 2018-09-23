// @flow

export type OpenSplitWalletModalAction = {
  type: 'OPEN_SPLIT_WALLET_MODAL',
  data: { walletId: string }
}

export type CloseSplitWalletModalAction = {
  type: 'CLOSE_SPLIT_WALLET_MODAL'
}

export type SplitWalletModalAction = OpenSplitWalletModalAction | CloseSplitWalletModalAction
