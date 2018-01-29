// @flow
import {connect} from 'react-redux'
import WalletList from './WalletList.ui'
import {
  updateActiveWalletsOrder,
  updateArchivedWalletsOrder
} from './action'
import type {State} from '../../../ReduxTypes'

import { walletRowOption } from './components/WalletOptions/action.js'

import {setContactList} from '../../contacts/action'
import * as CORE_SELECTORS from '../../../Core/selectors.js'
import * as UI_SELECTORS from '../../selectors.js'
import * as SETTINGS_SELECTORS from '../../Settings/selectors'

const mapStateToProps = (state: State): {} => {
  const currencyConverter = CORE_SELECTORS.getCurrencyConverter(state)
  const settings = SETTINGS_SELECTORS.getSettings(state)

  return {
    settings,
    coreWallets: state.core.wallets.byId,
    wallets: state.ui.wallets.byId,
    activeWalletIds: UI_SELECTORS.getActiveWalletIds(state),
    archivedWalletIds: UI_SELECTORS.getArchivedWalletIds(state),
    walletArchivesVisible: state.ui.scenes.walletList.walletArchivesVisible,
    walletName: state.ui.scenes.walletList.walletName,
    walletId: state.ui.scenes.walletList.walletId,
    currencyConverter,
    dimensions: state.ui.scenes.dimensions,
    customTokens: state.ui.settings.customTokens
  }
}

const mapDispatchToProps = (dispatch: Dispatch): {} => ({
  updateActiveWalletsOrder: (activeWalletIds) => dispatch(updateActiveWalletsOrder(activeWalletIds)),
  updateArchivedWalletsOrder: (archivedWalletIds) => dispatch(updateArchivedWalletsOrder(archivedWalletIds)),
  setContactList: (contacts) => dispatch(setContactList(contacts)),
  walletRowOption: (walletId: string, option: string, archived: boolean) => dispatch(walletRowOption(walletId, option, archived))
})

export default connect(mapStateToProps, mapDispatchToProps)(WalletList)
