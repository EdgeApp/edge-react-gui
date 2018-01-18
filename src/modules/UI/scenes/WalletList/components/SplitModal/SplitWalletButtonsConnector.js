// @flow

import {connect} from 'react-redux'

import SplitWalletButtons from './SplitWalletButtons.ui'
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

const getSplitType = () => 'wallet:bitcoincash'

const splitWallet = (walletId: string) => (dispatch: Dispatch, getState: GetState) => {
  const state = getState()
  const account = CORE_SELECTORS.getAccount(state)

  dispatch(wrap(START_MODAL_VALUE(Constants.SPLIT_VALUE), {walletId}))

  account.splitWalletInfo(walletId, getSplitType())
    .then(() => {
      dispatch(wrap(SUCCESS_MODAL_VALUE(Constants.SPLIT_VALUE), {walletId}))
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
  onPositive: (walletId) => dispatch(splitWallet(walletId)),
  onDone: () => dispatch({ type: CLOSE_MODAL_VALUE(Constants.SPLIT_VALUE) })
})

export default connect(mapStateToProps, mapDispatchToProps)(SplitWalletButtons)
