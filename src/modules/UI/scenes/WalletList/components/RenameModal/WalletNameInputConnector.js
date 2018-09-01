// @flow

import { connect } from 'react-redux'

import type { Dispatch, State } from '../../../../../ReduxTypes'
import WalletNameInput from './WalletNameInput.ui'

export const UPDATE_RENAME_WALLET_INPUT = 'UPDATE_RENAME_WALLET_INPUT'

const updateRenameWalletInput = (renameWalletInput: string) => ({
  type: UPDATE_RENAME_WALLET_INPUT,
  data: { renameWalletInput }
})

const mapStateToProps = (state: State) => ({
  currentWalletBeingRenamed: state.ui.scenes.walletList.walletName,
  // /currentWalletRename:       state.ui.scenes.walletList.currentWalletRename,
  // $FlowFixMe
  renameWalletVisible: state.ui.scenes.walletList.renameWalletVisible,
  renameWalletInput: state.ui.scenes.walletList.renameWalletInput
})
const mapDispatchToProps = (dispatch: Dispatch) => ({
  updateRenameWalletInput: walletName => dispatch(updateRenameWalletInput(walletName))
})

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(WalletNameInput)
