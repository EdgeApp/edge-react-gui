// @flow

import type { EdgeSpendInfo, EdgeTransaction } from 'edge-core-js'

import type { Dispatch, GetState } from '../modules/ReduxTypes.js'
import { activated as primaryModalActivated, deactivated as primaryModalDeactivated } from './PrimaryModalActions.js'
import { activated as secondaryModalActivated, deactivated as secondaryModalDeactivated } from './SecondaryModalActions.js'

export const sweepPrivateKeyStart = () => ({
  type: 'PRIVATE_KEY_MODAL/SWEEP_PRIVATE_KEY_START'
})

export const sweepPrivateKeySuccess = () => ({
  type: 'PRIVATE_KEY_MODAL/SWEEP_PRIVATE_KEY_SUCCESS',
  data: {}
})

export const sweepPrivateKeyFail = (error: Error) => ({
  type: 'PRIVATE_KEY_MODAL/SWEEP_PRIVATE_KEY_FAIL',
  data: { error }
})

export const sweepPrivateKeyReset = () => ({
  type: 'PRIVATE_KEY_MODAL/SWEEP_PRIVATE_KEY_RESET',
  data: {}
})

export const activated = () => (dispatch: Dispatch) => {
  setTimeout(() => dispatch(primaryModalActivated()), 500)
}

export const deactivated = () => (dispatch: Dispatch) => {
  dispatch(primaryModalDeactivated())
  setTimeout(() => dispatch(secondaryModalDeactivated()), 500)
}

export const onPrivateKeyAccept = () => (dispatch: Dispatch, getState: GetState) => {
  dispatch(primaryModalDeactivated())
  setTimeout(() => {
    dispatch(sweepPrivateKeyStart())
    dispatch(secondaryModalActivated())

    const state = getState()
    const parsedUri = state.ui.scenes.scan.parsedUri
    if (!parsedUri) return
    const selectedWalletId = state.ui.wallets.selectedWalletId
    const edgeWallet = state.core.wallets.byId[selectedWalletId]

    const spendInfo: EdgeSpendInfo = {
      privateKeys: parsedUri.privateKeys,
      spendTargets: []
    }

    edgeWallet.sweepPrivateKeys(spendInfo).then(
      (unsignedTx: EdgeTransaction) => {
        edgeWallet
          .signTx(unsignedTx)
          .then(signedTx => edgeWallet.broadcastTx(signedTx))
          .then(() => dispatch(sweepPrivateKeySuccess()))
      },
      (error: Error) => {
        dispatch(sweepPrivateKeyFail(error))
      }
    )
  }, 1000)
}

export const onPrivateKeyReject = () => (dispatch: Dispatch, getState: GetState) => {
  dispatch(primaryModalDeactivated())
}
