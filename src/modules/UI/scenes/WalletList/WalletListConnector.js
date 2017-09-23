// @flow
import {connect} from 'react-redux'
import WalletList from './WalletList.ui'
import {
  updateActiveWalletsOrder,
  updateArchivedWalletsOrder,
  walletRowOption
} from './action'
import {setContactList} from '../../contacts/action'
import * as CORE_SELECTORS from '../../../Core/selectors.js'
import * as UI_SELECTORS from '../../selectors.js'
import * as SETTINGS_SELECTORS from '../../Settings/selectors'
const mapStateToProps = (state: any): {} => {
  const currencyConverter = CORE_SELECTORS.getCurrencyConverter(state)
  const settings = SETTINGS_SELECTORS.getSettings(state)

  return {
    // updatingBalance: state.ui.scenes.transactionList.updatingBalance,
    settings,
    coreWallets: state.core.wallets.byId,
    wallets: state.ui.wallets.byId,
    activeWalletIds: UI_SELECTORS.getActiveWalletIds(state),
    archivedWalletIds: UI_SELECTORS.getArchivedWalletIds(state),
    walletArchivesVisible: state.ui.scenes.walletList.walletArchivesVisible,
    renameWalletModalVisible: state.ui.scenes.walletList.renameWalletModalVisible,
    deleteWalletModalVisible: state.ui.scenes.walletList.deleteWalletModalVisible,
    walletName: state.ui.scenes.walletList.walletName,
    walletId: state.ui.scenes.walletList.walletId,
    walletOrder: state.ui.wallets.walletListOrder,
    currencyConverter,
    dimensions: state.ui.scenes.dimensions
  }
}

const mapDispatchToProps = (dispatch: Function): {} => ({
  updateActiveWalletsOrder: (activeWalletIds) => dispatch(updateActiveWalletsOrder(activeWalletIds)),
  updateArchivedWalletsOrder: (archivedWalletIds) => dispatch(updateArchivedWalletsOrder(archivedWalletIds)),
  setContactList: (contacts) => dispatch(setContactList(contacts)),
  walletRowOption: (walletId, option) => dispatch(walletRowOption(walletId, option))
})

export default connect(mapStateToProps, mapDispatchToProps)(WalletList)
