// @flow

import { connect } from 'react-redux'

import { disableOtp, keepOtp } from '../../../../actions/OtpActions'
import * as CORE_SELECTORS from '../../../Core/selectors.js'
import type { Dispatch, State } from '../../../ReduxTypes'
import * as UI_SELECTORS from '../../selectors.js'
import * as SETTINGS_SELECTORS from '../../Settings/selectors'
import { toggleAccountBalanceVisibility, toggleWalletFiatBalanceVisibility, updateActiveWalletsOrder, updateArchivedWalletsOrder } from './action'
import { walletRowOption } from './components/WalletOptions/action.js'
import WalletList from './WalletList.ui'

const mapStateToProps = (state: State) => {
  const currencyConverter = CORE_SELECTORS.getCurrencyConverter(state)
  const settings = SETTINGS_SELECTORS.getSettings(state)
  const coreWallets = state.core.wallets.byId
  const wallets = state.ui.wallets.byId
  const activeWalletIds = UI_SELECTORS.getActiveWalletIds(state)
  const archivedWalletIds = UI_SELECTORS.getArchivedWalletIds(state)
  const walletArchivesVisible = state.ui.scenes.walletList.walletArchivesVisible
  const walletName = state.ui.scenes.walletList.walletName
  const walletId = state.ui.scenes.walletList.walletId
  // $FlowFixMe
  const walletOrder = state.ui.wallets.walletListOrder
  const dimensions = state.ui.scenes.dimensions
  const customTokens = state.ui.settings.customTokens
  const otpResetPending = SETTINGS_SELECTORS.getOtpResetPending(state)
  const isAccountBalanceVisible = state.ui.settings.isAccountBalanceVisible
  const isWalletFiatBalanceVisible = state.ui.settings.isWalletFiatBalanceVisible
  const currentState = state

  return {
    settings,
    coreWallets,
    wallets,
    activeWalletIds,
    archivedWalletIds,
    walletArchivesVisible,
    walletName,
    walletId,
    walletOrder,
    currencyConverter,
    dimensions,
    customTokens,
    otpResetPending,
    isAccountBalanceVisible,
    isWalletFiatBalanceVisible,
    currentState
  }
}

const mapDispatchToProps = (dispatch: Dispatch, state: State) => ({
  updateActiveWalletsOrder: activeWalletIds => dispatch(updateActiveWalletsOrder(activeWalletIds)),
  updateArchivedWalletsOrder: archivedWalletIds => dispatch(updateArchivedWalletsOrder(archivedWalletIds)),
  // $FlowFixMe
  walletRowOption: (walletId, option, archived) => dispatch(walletRowOption(walletId, option, archived)),
  disableOtp: () => dispatch(disableOtp()),
  keepOtp: () => dispatch(keepOtp()),
  toggleAccountBalanceVisibility: () => dispatch(toggleAccountBalanceVisibility()),
  toggleWalletFiatBalanceVisibility: () => dispatch(toggleWalletFiatBalanceVisibility())
})

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(WalletList)
