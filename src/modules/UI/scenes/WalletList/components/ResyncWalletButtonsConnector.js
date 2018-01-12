// @flow
import {connect} from 'react-redux'
import ResyncWalletButtons from './ResyncWalletButtons.ui'
import type {State, Dispatch} from '../../../../ReduxTypes'
import {closeResyncWalletModal, resyncWallet} from '../action'

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
  onDone: () => dispatch(closeResyncWalletModal())
})

export default connect(mapStateToProps, mapDispatchToProps)(ResyncWalletButtons)
