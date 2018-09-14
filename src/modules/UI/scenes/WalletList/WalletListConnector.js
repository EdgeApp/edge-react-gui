// @flow

import { connect } from 'react-redux'

import type { Dispatch, State } from '../../../ReduxTypes'
import * as UI_SELECTORS from '../../selectors.js'
import * as SETTINGS_SELECTORS from '../../Settings/selectors'
import { toggleAccountBalanceVisibility, toggleWalletFiatBalanceVisibility, updateActiveWalletsOrder, updateArchivedWalletsOrder } from './action'
import { walletRowOption } from './components/WalletOptions/action.js'
import WalletList from './WalletList.ui'

const mapStateToProps = (state: State) => {
  const coreWallets = state.core.wallets.byId
  const wallets = state.ui.wallets.byId
  const activeWalletIds = UI_SELECTORS.getActiveWalletIds(state)
  const archivedWalletIds = UI_SELECTORS.getArchivedWalletIds(state)
  const walletArchivesVisible = state.ui.scenes.walletList.walletArchivesVisible
  // $FlowFixMe
  const dimensions = state.ui.scenes.dimensions
  const customTokens = state.ui.settings.customTokens
  const isWalletFiatBalanceVisible = state.ui.settings.isWalletFiatBalanceVisible
  const defaultFiat = SETTINGS_SELECTORS.getDefaultFiat(state)

  return {
    coreWallets,
    wallets,
    activeWalletIds,
    archivedWalletIds,
    walletArchivesVisible,
    dimensions,
    customTokens,
    isWalletFiatBalanceVisible,
    defaultFiat
  }
}

const mapDispatchToProps = (dispatch: Dispatch, state: State) => ({
  updateActiveWalletsOrder: activeWalletIds => dispatch(updateActiveWalletsOrder(activeWalletIds)),
  updateArchivedWalletsOrder: archivedWalletIds => dispatch(updateArchivedWalletsOrder(archivedWalletIds)),
  // $FlowFixMe
  walletRowOption: (walletId, option, archived) => dispatch(walletRowOption(walletId, option, archived)),
  toggleAccountBalanceVisibility: () => dispatch(toggleAccountBalanceVisibility()),
  toggleWalletFiatBalanceVisibility: () => dispatch(toggleWalletFiatBalanceVisibility())
})

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(WalletList)
