// @flow

import {connect} from 'react-redux'

import ResyncWalletButtons from './ResyncWalletButtons.ui'
import type {State, Dispatch} from '../../../../ReduxTypes'
import * as Constants from '../../../../../constants/indexConstants'
import {CLOSE_MODAL_VALUE, resyncWallet} from './WalletOptions/action'

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
  onDone: () => dispatch({ type: CLOSE_MODAL_VALUE(Constants.WALLET_OPTIONS.RESYNC.value) })
})

export default connect(mapStateToProps, mapDispatchToProps)(ResyncWalletButtons)
