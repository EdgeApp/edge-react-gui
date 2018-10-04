// @flow

export type OpenGetSeedModalAction = {
  type: 'OPEN_GETSEED_WALLET_MODAL',
  data: { walletId: string }
}

export type CloseGetSeedModalAction = {
  type: 'CLOSE_GETSEED_WALLET_MODAL'
}

export type LockWalletSeedAction = {
  type: 'LOCK_WALLET_SEED'
}

export type UnlockWalletSeedAction = {
  type: 'UNLOCK_WALLET_SEED'
}

export type GetSeedModalAction = OpenGetSeedModalAction | CloseGetSeedModalAction | LockWalletSeedAction | UnlockWalletSeedAction
