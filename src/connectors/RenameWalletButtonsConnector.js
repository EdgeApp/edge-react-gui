// @flow

import { connect } from 'react-redux'

import * as UI_ACTIONS from '../actions/WalletActions.js'
import type { DispatchProps, StateProps } from '../components/common/RenameWalletButtons'
import RenameWalletButtons from '../components/common/RenameWalletButtons'
import * as CORE_SELECTORS from '../modules/Core/selectors.js'
import * as WALLET_API from '../modules/Core/Wallets/api.js'
import type { Dispatch, GetState, State } from '../modules/ReduxTypes'

const renameWallet = (walletId: string, walletName: string) => (dispatch: Dispatch, getState: GetState) => {
  const state = getState()
  const wallet = CORE_SELECTORS.getWallet(state, walletId)

  dispatch({ type: 'RENAME_WALLET_START', data: { walletId } })

  WALLET_API.renameWalletRequest(wallet, walletName)
    .then(() => {
      dispatch({ type: 'CLOSE_RENAME_WALLET_SUCCESS', data: { walletId } })
      dispatch(UI_ACTIONS.refreshWallet(walletId))
    })
    .catch(error => console.log(error))
}

const mapStateToProps = (state: State): StateProps => ({
  walletId: state.ui.scenes.walletList.walletId,
  renameWalletInput: state.ui.scenes.walletList.renameWalletInput,
  walletName: state.ui.scenes.walletList.walletName
})

const mapDispatchToProps = (dispatch: Dispatch): DispatchProps => ({
  onNegative: () => {},
  onPositive: (walletId: string, walletName: string) => dispatch(renameWallet(walletId, walletName)),
  onDone: () => dispatch({ type: 'CLOSE_RENAME_WALLET_MODAL' })
})

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(RenameWalletButtons)
