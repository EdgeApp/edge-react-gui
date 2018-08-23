// @flow

import { connect } from 'react-redux'

import * as Constants from '../../../../../../constants/indexConstants.js'
import * as CORE_SELECTORS from '../../../../../Core/selectors.js'
import type { Dispatch, GetState, State } from '../../../../../ReduxTypes'
import * as UI_ACTIONS from '../../../../Wallets/action.js'
import { CLOSE_MODAL_VALUE, START_MODAL_VALUE, SUCCESS_MODAL_VALUE, wrap } from '../WalletOptions/action'
import SplitWalletButtons from './SplitWalletButtons.ui'

const getSplitType = () => 'wallet:bitcoincash'

const splitWallet = (walletId: string) => (dispatch: Dispatch, getState: GetState) => {
  const state = getState()
  const account = CORE_SELECTORS.getAccount(state)

  dispatch(wrap(START_MODAL_VALUE(Constants.SPLIT_VALUE), { walletId }))

  return account.splitWalletInfo(walletId, getSplitType()).then(() => {
    dispatch(wrap(SUCCESS_MODAL_VALUE(Constants.SPLIT_VALUE), { walletId }))
    dispatch(UI_ACTIONS.refreshWallet(walletId))
  })
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
  onPositive: walletId => dispatch(splitWallet(walletId)),
  onDone: () => dispatch({ type: CLOSE_MODAL_VALUE(Constants.SPLIT_VALUE) })
})

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(SplitWalletButtons)
