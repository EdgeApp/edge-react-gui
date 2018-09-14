// @flow

import { connect } from 'react-redux'

import * as Constants from '../../../../../../constants/indexConstants.js'
import * as ACCOUNT_API from '../../../../../Core/Account/api.js'
import * as CORE_SELECTORS from '../../../../../Core/selectors.js'
import type { Dispatch, GetState, State } from '../../../../../ReduxTypes'
import { CLOSE_MODAL_VALUE, START_MODAL_VALUE, SUCCESS_MODAL_VALUE, wrap } from '../WalletOptions/action'
import DeleteWalletButtons from './DeleteWalletButtons.ui'

const deleteWallet = (walletId: string) => (dispatch: Dispatch, getState: GetState) => {
  const state = getState()
  const account = CORE_SELECTORS.getAccount(state)

  dispatch(wrap(START_MODAL_VALUE(Constants.DELETE_VALUE), { walletId }))

  ACCOUNT_API.deleteWalletRequest(account, walletId)
    .then(() => {
      dispatch(wrap(SUCCESS_MODAL_VALUE(Constants.DELETE_VALUE), { walletId }))
    })
    .catch(e => console.log(e))
}

const mapStateToProps = (state: State) => ({
  walletId: state.ui.scenes.walletList.walletId
})
const mapDispatchToProps = (dispatch: Dispatch) => ({
  onNegative: () => {},
  onPositive: walletId => dispatch(deleteWallet(walletId)),
  onDone: () => dispatch({ type: CLOSE_MODAL_VALUE(Constants.DELETE_VALUE) })
})

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(DeleteWalletButtons)
