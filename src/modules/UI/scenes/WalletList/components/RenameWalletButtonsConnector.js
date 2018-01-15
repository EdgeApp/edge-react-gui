// @flow

import {connect} from 'react-redux'

import RenameWalletButtons, {type StateProps, type DispatchProps} from './RenameWalletButtons.ui'
import type {State, Dispatch} from '../../../../ReduxTypes'
import * as Constants from '../../../../../constants/indexConstants'
import {
  CLOSE_MODAL_VALUE,
  renameWallet
} from './WalletOptions/action'

const mapStateToProps = (state: State): StateProps => ({
  walletId: state.ui.scenes.walletList.walletId,
  renameWalletInput: state.ui.scenes.walletList.renameWalletInput
})
const mapDispatchToProps = (dispatch: Dispatch): DispatchProps => ({
  onNegative: () => {},
  onPositive: (walletId: string, walletName: string) => dispatch(renameWallet(walletId, walletName)),
  onDone: () => dispatch({ type: CLOSE_MODAL_VALUE(Constants.WALLET_OPTIONS.RENAME.value) })
})

export default connect(mapStateToProps, mapDispatchToProps)(RenameWalletButtons)
