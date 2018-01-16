// @flow

import {connect} from 'react-redux'

import ResyncWalletButtons from './ResyncWalletButtons.ui'
import type {State, Dispatch, GetState} from '../../../../../ReduxTypes'
import * as Constants from '../../../../../../constants/indexConstants.js'
import {
  CLOSE_MODAL_VALUE,
  START_MODAL_VALUE,
  SUCCESS_MODAL_VALUE,
  wrap
} from '../WalletOptions/action'

import * as WALLET_API from '../../../../../Core/Wallets/api.js'
import * as UI_ACTIONS from '../../../../Wallets/action.js'
import * as CORE_SELECTORS from '../../../../../Core/selectors.js'

const resyncWallet = (walletId: string) => (dispatch: Dispatch, getState: GetState) => {
  const state = getState()
  const wallet = CORE_SELECTORS.getWallet(state, walletId)

  dispatch(wrap(START_MODAL_VALUE(Constants.RESYNC_VALUE), {walletId}))

  WALLET_API.resyncWallet(wallet)
    .then(() => {
      dispatch(wrap(SUCCESS_MODAL_VALUE(Constants.RESYNC_VALUE), {walletId}))
      dispatch(UI_ACTIONS.refreshWallet(walletId))
    })
    .catch((e) => console.log(e))
}

export type StateProps = {
  walletId: string
}

export type DispatchProps = {
  onPositive: (walletId: string) => any,
  onNegative: () => any,
  onDone: () => any
}

const mapStateToProps = (state: State): StateProps => ({
  walletId: state.ui.scenes.walletList.walletId
})

const mapDispatchToProps = (dispatch: Dispatch): DispatchProps => ({
  onNegative: () => {},
  onPositive: (walletId) => dispatch(resyncWallet(walletId)),
  onDone: () => dispatch({ type: CLOSE_MODAL_VALUE(Constants.RESYNC_VALUE) })
})

export default connect(mapStateToProps, mapDispatchToProps)(ResyncWalletButtons)
