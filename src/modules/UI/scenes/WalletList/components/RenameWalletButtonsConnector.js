// @flow

import {connect} from 'react-redux'

import RenameWalletButtons, {type StateProps, type DispatchProps} from './RenameWalletButtons.ui'
import type {State, Dispatch} from '../../../../ReduxTypes'
import {
  CLOSE_RENAME_WALLET_MODAL,
  renameWallet
} from '../action'

const mapStateToProps = (state: State): StateProps => ({
  walletId: state.ui.scenes.walletList.walletId,
  renameWalletInput: state.ui.scenes.walletList.renameWalletInput
})
const mapDispatchToProps = (dispatch: Dispatch): DispatchProps => ({
  onNegative: () => {},
  onPositive: (walletId: string, walletName: string) => dispatch(renameWallet(walletId, walletName)),
  onDone: () => dispatch({type: CLOSE_RENAME_WALLET_MODAL})
})

export default connect(mapStateToProps, mapDispatchToProps)(RenameWalletButtons)
