// @flow

import { connect } from 'react-redux'

import * as ACCOUNT_API from '../../../../../Core/Account/api.js'
import * as CORE_SELECTORS from '../../../../../Core/selectors.js'
import type { Dispatch, GetState, State } from '../../../../../ReduxTypes'
import DeleteWalletButtons from './DeleteWalletButtons.ui'

const deleteWallet = (walletId: string) => (dispatch: Dispatch, getState: GetState) => {
  const state = getState()
  const account = CORE_SELECTORS.getAccount(state)

  dispatch({ type: 'DELETE_WALLET_START', data: { walletId } })

  ACCOUNT_API.deleteWalletRequest(account, walletId)
    .then(() => {
      dispatch({ type: 'CLOSE_DELETE_WALLET_SUCCESS', data: { walletId } })
    })
    .catch(error => console.log(error))
}

const mapStateToProps = (state: State) => ({
  walletId: state.ui.scenes.walletList.walletId
})
const mapDispatchToProps = (dispatch: Dispatch) => ({
  onNegative: () => {},
  onPositive: walletId => dispatch(deleteWallet(walletId)),
  onDone: () => dispatch({ type: 'CLOSE_DELETE_WALLET_MODAL' })
})

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(DeleteWalletButtons)
