import {connect} from 'react-redux'
import RenameWalletButtons from './RenameWalletButtons.ui'
import {
  updateRenameWalletInput,
  closeRenameWalletModal,
  renameWallet
} from '../action'

const mapStateToProps = (state) => ({
  currentWalletBeingRenamed: state.ui.wallets.byId[state.ui.wallets.selectedWalletId],
  walletId: state.ui.scenes.walletList.walletId,
  renameWalletInput: state.ui.scenes.walletList.renameWalletInput
})
const mapDispatchToProps = (dispatch) => ({
  onNegative: () => {},
  onPositive: (walletId, walletName) => dispatch(renameWallet(walletId, walletName)),
  onDone: () => dispatch(closeRenameWalletModal()),
  updateRenameWalletInput: (input) => updateRenameWalletInput(input)
})

export default connect(mapStateToProps, mapDispatchToProps)(RenameWalletButtons)
