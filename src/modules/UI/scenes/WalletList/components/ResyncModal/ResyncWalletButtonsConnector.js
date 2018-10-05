// @flow

import { connect } from 'react-redux'

import * as CORE_SELECTORS from '../../../../../Core/selectors.js'
import * as WALLET_API from '../../../../../Core/Wallets/api.js'
import type { Dispatch, GetState, State } from '../../../../../ReduxTypes'
import * as UI_ACTIONS from '../../../../Wallets/action.js'
import ResyncWalletButtons from './ResyncWalletButtons.ui'

const resyncWallet = (walletId: string) => (dispatch: Dispatch, getState: GetState) => {
  const state = getState()
  const wallet = CORE_SELECTORS.getWallet(state, walletId)

  dispatch({ type: 'RESYNC_WALLET_START', data: { walletId } })

  WALLET_API.resyncWallet(wallet)
    .then(() => {
      dispatch({ type: 'CLOSE_RESYNC_WALLET_SUCCESS', data: { walletId } })
      dispatch(UI_ACTIONS.refreshWallet(walletId))
    })
    .catch(error => console.log(error))
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
  onPositive: walletId => dispatch(resyncWallet(walletId)),
  onDone: () => dispatch({ type: 'CLOSE_RESYNC_WALLET_MODAL' })
})

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(ResyncWalletButtons)
