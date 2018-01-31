// @flow

import {connect} from 'react-redux'

import WalletNameInput from './WalletNameInput.ui'
import type {State, Dispatch} from '../../../../../ReduxTypes'
import {getWalletName, getRenameWalletInput, getRenameWalletModalVisible} from '../../selectors.js'

export const UPDATE_RENAME_WALLET_INPUT = 'UPDATE_RENAME_WALLET_INPUT'

const updateRenameWalletInput = (renameWalletInput: string) => ({
  type: UPDATE_RENAME_WALLET_INPUT,
  data: {renameWalletInput}
})

const mapStateToProps = (state: State) => ({
  currentWalletBeingRenamed: getWalletName(state),
  // /currentWalletRename:       state.ui.scenes.walletList.currentWalletRename,
  // $FlowFixMe
  renameWalletVisible: getRenameWalletModalVisible(state),
  renameWalletInput: getRenameWalletInput(state)
})
const mapDispatchToProps = (dispatch: Dispatch) => ({
  updateRenameWalletInput: (walletName) => dispatch(updateRenameWalletInput(walletName))
})

export default connect(mapStateToProps, mapDispatchToProps)(WalletNameInput)
