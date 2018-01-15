// @flow

import {connect} from 'react-redux'

import SplitWalletButtons from './SplitWalletButtons.ui'
import type {State, Dispatch} from '../../../../ReduxTypes'
import * as Constants from '../../../../../constants/indexConstants'
import {CLOSE_MODAL_VALUE, splitWallet} from './WalletOptions/action'

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
  onDone: () => dispatch({ type: CLOSE_MODAL_VALUE(Constants.WALLET_OPTIONS.SPLIT.value) })
})

export default connect(mapStateToProps, mapDispatchToProps)(SplitWalletButtons)
