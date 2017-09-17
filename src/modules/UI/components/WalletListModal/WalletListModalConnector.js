// @flow
import {connect} from 'react-redux'
import WalletListModal from './WalletListModal.ui'

const mapStateToProps = (state) => ({
  walletList: state.ui.wallets.byId,
  dropdownWalletListVisible: state.ui.scenes.walletListModal.walletListModalVisible,
  walletTransferModalVisible: state.ui.scenes.walletTransferList.walletListModalVisible,
  scanToWalletListModalVisibility: state.ui.scenes.scan.scanToWalletListModalVisibility,
  dimensions: state.ui.scenes.dimensions
})

const mapDispatchToProps = () => ({})
export default connect(mapStateToProps, mapDispatchToProps)(WalletListModal)
