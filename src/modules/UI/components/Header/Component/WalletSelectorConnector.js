import {connect} from 'react-redux'
import WalletSelector from './WalletSelector.ui'
import * as UI_SELECTORS from '../../../selectors'
import {
  toggleSelectedWalletListModal,
  toggleScanToWalletListModal
} from '../../WalletListModal/action'

const mapStateToProps = (state) => ({
  walletList: UI_SELECTORS.getWallets(state),

  selectedWallet: UI_SELECTORS.getSelectedWallet(state),
  selectedWalletCurrencyCode: UI_SELECTORS.getSelectedCurrencyCode(state),

  activeWalletIds: UI_SELECTORS.getActiveWalletIds(state),
  archivedWalletIds: UI_SELECTORS.getArchivedWalletIds(state),

  selectedWalletListModalVisibility: state.ui.scenes.scan.selectedWalletListModalVisibility,
  scanToWalletListModalVisibility: state.ui.scenes.scan.scanToWalletListModalVisibility
})

const mapDispatchToProps = (dispatch) => ({
  toggleSelectedWalletListModal: () => dispatch(toggleSelectedWalletListModal()),
  toggleScanToWalletListModal: () => dispatch(toggleScanToWalletListModal()),
})
export default connect(mapStateToProps, mapDispatchToProps)(WalletSelector)
