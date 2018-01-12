// @flow
import {connect} from 'react-redux'
import ResyncWalletButtons from './ResyncWalletButtons.ui'
import type {State, Dispatch} from '../../../../ReduxTypes'
import {CLOSE_RESYNC_WALLET_MODAL, resyncWallet} from '../action'

export type StateToProps = {
  walletId: string
}

export type DispatchProps = {
  onPositive: (walletId: string) => any,
  onNegative: () => any,
  onDone: () => any
}

const mapStateToProps = (state: State): StateToProps => ({
  walletId: state.ui.scenes.walletList.walletId
})
const mapDispatchToProps = (dispatch: Dispatch): DispatchProps => ({
  onNegative: () => {},
  onPositive: (walletId) => dispatch(resyncWallet(walletId)),
  onDone: () => dispatch({ type: CLOSE_RESYNC_WALLET_MODAL })
})

export default connect(mapStateToProps, mapDispatchToProps)(ResyncWalletButtons)
