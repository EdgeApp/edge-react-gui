// @flow

import type { EdgeCurrencyWallet, EdgeSpendInfo } from 'edge-login'
import { Actions } from 'react-native-router-flux'

import type { Dispatch, GetState } from '../../../../ReduxTypes.js'

export const PREFIX = 'PRIVATE_KEY_MODAL/'

export const RESET = PREFIX + 'RESET'
export const reset = () => ({
  type: RESET
})

export const DISMISS_MODAL = PREFIX + 'DISMISS_MODAL'
export const dismissModal = () => ({
  type: DISMISS_MODAL
})

export const SWEEP_PRIVATE_KEY_START = PREFIX + 'SWEEP_PRIVATE_KEY_START'
export const sweepPrivateKeyStart = () => ({
  type: SWEEP_PRIVATE_KEY_START
})

export const SWEEP_PRIVATE_KEY_SUCCESS = PREFIX + 'SWEEP_PRIVATE_KEY_SUCCESS'
export const sweepPrivateKeySuccess = () => ({
  type: SWEEP_PRIVATE_KEY_SUCCESS,
  data: {}
})

export const SWEEP_PRIVATE_KEY_FAIL = PREFIX + 'SWEEP_PRIVATE_KEY_FAIL'
export const sweepPrivateKeyFail = (error: Error) => ({
  type: SWEEP_PRIVATE_KEY_FAIL,
  data: {
    error
  }
})

export const sweepPrivateKey = () => (dispatch: Dispatch, getState: GetState) => {
  const state = getState()
  const selectedWalletId = state.ui.wallets.selectedWalletId
  const wallet: EdgeCurrencyWallet = state.core.wallets.byId[selectedWalletId]
  const parsedUri = state.ui.scenes.scan.parsedUri
  if (!parsedUri) { return }

  const spendInfo: EdgeSpendInfo = {
    privateKeys: [parsedUri.privateKey],
    spendTargets: []
  }

  dispatch(sweepPrivateKeyStart())
  Promise.resolve(() => spendInfo)
    // $FlowFixMe
    .then(wallet.sweepPrivateKey)
    // $FlowFixMe
    .then(wallet.signTx)
    .then(wallet.broadcastTx)
    .then(wallet.saveTx)
    .then(
      edgeTransaction => {
        dispatch(sweepPrivateKeySuccess())
        Actions.transactionDetails({ edgeTransaction })
      },
      error => dispatch(sweepPrivateKeyFail(error))
    )
}
