// @flow

import { connect } from 'react-redux'

import type { State } from '../../../ReduxTypes.js'
import WalletListModal from './WalletListModal.ui'

const mapStateToProps = (state: State, ownProps: any) => {
  const topDisplacement = ownProps.topDisplacement ? ownProps.topDisplacement : 68
  const whichWallet = ownProps.whichWallet ? ownProps.whichWallet : null
  const wallets = ownProps.wallets || state.ui.wallets.byId
  return {
    type: ownProps.type,
    whichWallet,
    topDisplacement,
    walletList: state.ui.wallets.byId,
    // $FlowFixMe
    dropdownWalletListVisible: state.ui.scenes.walletListModal.walletListModalVisible,
    walletTransferModalVisible: state.ui.scenes.walletTransferList.walletListModalVisible,
    scanToWalletListModalVisibility: state.ui.scenes.scan.scanToWalletListModalVisibility,
    dimensions: state.ui.scenes.dimensions,
    wallets
  }
}

// const mapDispatchToProps = () => ({})
export default connect(mapStateToProps, {})(WalletListModal)
