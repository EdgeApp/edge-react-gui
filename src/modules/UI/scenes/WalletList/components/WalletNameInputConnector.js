// @flow

import {connect} from 'react-redux'

import WalletNameInput from './WalletNameInput.ui'
import {updateRenameWalletInput} from '../action'

import type {Dispatch, State} from '../../../../ReduxTypes'

const mapStateToProps = (state: State) => ({
  currentWalletBeingRenamed: state.ui.scenes.walletList.walletName,
  // /currentWalletRename:       state.ui.scenes.walletList.currentWalletRename,
  renameWalletVisible: state.ui.scenes.walletList.renameWalletVisible,
  renameWalletInput: state.ui.scenes.walletList.renameWalletInput
})
const mapDispatchToProps = (dispatch: Dispatch) => ({
  updateRenameWalletInput: (walletName) => dispatch(updateRenameWalletInput(walletName))
})

export default connect(mapStateToProps, mapDispatchToProps)(WalletNameInput)
