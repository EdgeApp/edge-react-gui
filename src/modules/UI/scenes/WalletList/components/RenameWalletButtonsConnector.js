// @flow
import {connect} from 'react-redux'
import RenameWalletButtons, {type StateToProps, type DispatchProps} from './RenameWalletButtons.ui'
import type {State, Dispatch} from '../../../../ReduxTypes'
import {
  closeRenameWalletModal,
  renameWallet
} from '../action'

const mapStateToProps = (state: State): StateToProps => ({
  walletId: state.ui.scenes.walletList.walletId,
  renameWalletInput: state.ui.scenes.walletList.renameWalletInput
})
const mapDispatchToProps = (dispatch: Dispatch): DispatchProps => ({
  onNegative: () => {},
  onPositive: (walletId, walletName) => dispatch(renameWallet(walletId, walletName)),
  onDone: () => dispatch(closeRenameWalletModal()),
})

export default connect(mapStateToProps, mapDispatchToProps)(RenameWalletButtons)
