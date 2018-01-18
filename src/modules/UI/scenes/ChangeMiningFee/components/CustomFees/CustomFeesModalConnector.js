// @flow

import {connect} from 'react-redux'

import CustomFeesModal from './CustomFeesModal.ui'
import * as Constants from '../../../../../../constants/indexConstants.js'
import type {Dispatch, GetState, State} from '../../../../../ReduxTypes'
import {
  VISIBLE_MODAL_NAME,
  CLOSE_MODAL_VALUE,
  START_MODAL_VALUE,
  SUCCESS_MODAL_VALUE,
  wrap
} from '../../../WalletList/components/WalletOptions/action'

import * as CORE_SELECTORS from '../../../../../Core/selectors.js'
import * as ACCOUNT_API from '../../../../../Core/Account/api.js'

const updateFees = (walletId: string) => (dispatch: Dispatch, getState: GetState) => {
  const state = getState()
  const account = CORE_SELECTORS.getAccount(state)

  dispatch(wrap(START_MODAL_VALUE(Constants.CUSTOM_FEES), {walletId}))
  dispatch(wrap(SUCCESS_MODAL_VALUE(Constants.CUSTOM_FEES), {walletId}))

  // ACCOUNT_API.updateFeesRequest(account, walletId)
  //   .then(() => {
  //     dispatch(wrap(SUCCESS_MODAL_VALUE(Constants.CUSTOM_FEES), {walletId}))
  //   })
  //   .catch((e) => console.log(e))
}

const mapStateToProps = (state: State) => ({
  visibilityBoolean: state.ui.scenes.walletList[VISIBLE_MODAL_NAME(Constants.CUSTOM_FEES)],
  walletId: state.ui.scenes.walletList.walletId
})

const mapDispatchToProps = (dispatch: Dispatch) => ({
  onExitButtonFxn: () => dispatch({ type: CLOSE_MODAL_VALUE(Constants.CUSTOM_FEES) }),
  onNegative: () => {},
  onPositive: (walletId) => dispatch(updateFees(walletId)),
  onDone: () => dispatch({type: CLOSE_MODAL_VALUE(Constants.CUSTOM_FEES)})
})

export default connect(mapStateToProps, mapDispatchToProps)(CustomFeesModal)
