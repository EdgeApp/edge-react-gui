// @flow
import {connect} from 'react-redux'
import SplitWalletButtons from './SplitWalletButtons.ui'
import type {State, Dispatch} from '../../../../ReduxTypes'
import {closeSplitWalletModal, splitWallet} from '../action'

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
  onPositive: (walletId) => dispatch(splitWallet(walletId)),
  onDone: () => dispatch(closeSplitWalletModal())
})

export default connect(mapStateToProps, mapDispatchToProps)(SplitWalletButtons)
