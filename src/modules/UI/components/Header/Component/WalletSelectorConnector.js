import {connect} from 'react-redux'
import * as UI_SELECTORS from '../../../selectors'
import WalletSelector from './WalletSelector.ui'

const mapStateToProps = (state) => ({
  walletList: UI_SELECTORS.getWallets(state),

  selectedWallet: UI_SELECTORS.getSelectedWallet(state),
  selectedWalletCurrencyCode: UI_SELECTORS.getSelectedCurrencyCode(state),

  activeWalletIds: UI_SELECTORS.getActiveWalletIds(state),
  archivedWalletIds: UI_SELECTORS.getArchivedWalletIds(state),

  selectedWalletListModalVisibility: state.ui.scenes.scan.selectedWalletListModalVisibility,
  scanToWalletListModalVisibility: state.ui.scenes.scan.scanToWalletListModalVisibility
})
export default connect(mapStateToProps)(WalletSelector)
