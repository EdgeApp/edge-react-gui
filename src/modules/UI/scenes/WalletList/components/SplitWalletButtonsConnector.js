// @flow

import {connect} from 'react-redux'

import SplitWalletButtons from './SplitWalletButtons.ui'
import type {State, Dispatch} from '../../../../ReduxTypes'
import {CLOSE_SPLIT_WALLET_MODAL, splitWallet} from '../action'

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
  onPositive: (walletId) => dispatch(splitWallet(walletId)),
  onDone: () => dispatch({type: CLOSE_SPLIT_WALLET_MODAL})
})

export default connect(mapStateToProps, mapDispatchToProps)(SplitWalletButtons)
