// @flow
import {connect} from 'react-redux'
import WalletNameInput from './WalletNameInput.ui'
import {updateRenameWalletInput} from '../action'

const mapStateToProps = (state: any): {} => ({
  currentWalletBeingRenamed: state.ui.scenes.walletList.walletName,
  // /currentWalletRename:       state.ui.scenes.walletList.currentWalletRename,
  renameWalletVisible: state.ui.scenes.walletList.renameWalletVisible,
  renameWalletInput: state.ui.scenes.walletList.renameWalletInput
})
const mapDispatchToProps = (dispatch: Function): {} => ({
  updateRenameWalletInput: (walletName) => dispatch(updateRenameWalletInput(walletName))
})

export default connect(mapStateToProps, mapDispatchToProps)(WalletNameInput)
