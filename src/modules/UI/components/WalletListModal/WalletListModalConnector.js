// @flow

import {connect} from 'react-redux'

import WalletListModal from './WalletListModal.ui'

import type {
  // Dispatch,
  State
} from '../../../ReduxTypes'

import {getGuiWallets} from '../../Wallets/selectors.js'
import {getIsDropdownWalletListVisible} from '../../components/WalletListModal/selectors.js'
import {getIsWalletTransferModalVisible} from '../../scenes/WalletTransferList/selectors.js'
import {getIsScanToWalletListModalVisibile} from '../../scenes/Scan/selectors.js'
import {getDimensions} from '../../dimensions/selectors.js'

const mapStateToProps = (state: State, ownProps: Object) => {
  const topDisplacement = ownProps.topDisplacement ? ownProps.topDisplacement : 68
  const whichWallet = ownProps.whichWallet ? ownProps.whichWallet : null
  return {
    type: ownProps.type,
    whichWallet,
    topDisplacement,
    walletList: getGuiWallets(state),
    dropdownWalletListVisible: getIsDropdownWalletListVisible(state),
    walletTransferModalVisible: getIsWalletTransferModalVisible(state),
    scanToWalletListModalVisibility: getIsScanToWalletListModalVisibile(state),
    dimensions: getDimensions(state)
  }
}
const mapDispatchToProps = () => ({})
export default connect(mapStateToProps, mapDispatchToProps)(WalletListModal)
