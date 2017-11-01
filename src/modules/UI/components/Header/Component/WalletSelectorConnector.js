import {connect} from 'react-redux'
import WalletSelector from './WalletSelector.ui'
import * as UI_SELECTORS from '../../../selectors'
import {
  toggleSelectedWalletListModal,
  toggleScanToWalletListModal
} from '../../WalletListModal/action'

const mapStateToProps = (state, ownProps) => {

  const walletList = UI_SELECTORS.getWallets(state)

  const selectedWallet = UI_SELECTORS.getSelectedWallet(state)
  const selectedWalletCurrencyCode = UI_SELECTORS.getSelectedCurrencyCode(state)

  const activeWalletIds = UI_SELECTORS.getActiveWalletIds(state)
  const archivedWalletIds = UI_SELECTORS.getArchivedWalletIds(state)

  const selectedWalletListModalVisibility = state.ui.scenes.scan.selectedWalletListModalVisibility
  const scanToWalletListModalVisibility = state.ui.scenes.scan.scanToWalletListModalVisibility

  return {
    walletList,
    selectedWallet,
    selectedWalletCurrencyCode,
    activeWalletIds,
    archivedWalletIds,
    toggleFunction: ownProps.toggleFunction,
    visibleFlag: ownProps.visibleFlag,
    scanToWalletListModalVisibility,
    selectedWalletListModalVisibility,
  }
}
const mapDispatchToProps = (dispatch) => ({
  toggleSelectedWalletListModal: () => dispatch(toggleSelectedWalletListModal()),
  toggleScanToWalletListModal: () => dispatch(toggleScanToWalletListModal()),
})
export default connect(mapStateToProps, mapDispatchToProps)(WalletSelector)
