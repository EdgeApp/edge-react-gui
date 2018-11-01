// @flow

export type OpenXPubModalAction = {
  type: 'OPEN_VIEWXPUB_WALLET_MODAL',
  data: { walletId: string, xPub: string | null }
}

export type CloseXPubModalAction = {
  type: 'CLOSE_VIEWXPUB_WALLET_MODAL'
}

export type XPubModalAction = OpenXPubModalAction | CloseXPubModalAction
