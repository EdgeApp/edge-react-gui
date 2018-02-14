// @flow
import { connect } from 'react-redux'

import WalletListModal from './WalletListModal.ui'

const mapStateToProps = (state: any, ownProps: any) => {
  const topDisplacement = ownProps.topDisplacement ? ownProps.topDisplacement : 68
  const whichWallet = ownProps.whichWallet ? ownProps.whichWallet : null
  return {
    type: ownProps.type,
    whichWallet,
    topDisplacement,
    walletList: state.ui.wallets.byId,
    dropdownWalletListVisible: state.ui.scenes.walletListModal.walletListModalVisible,
    walletTransferModalVisible: state.ui.scenes.walletTransferList.walletListModalVisible,
    scanToWalletListModalVisibility: state.ui.scenes.scan.scanToWalletListModalVisibility,
    dimensions: state.ui.scenes.dimensions
  }
}

// const mapDispatchToProps = () => ({})
export default connect(mapStateToProps, null)(WalletListModal)
