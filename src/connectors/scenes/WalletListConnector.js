// @flow

import { connect } from 'react-redux'

import { disableOtp, keepOtp } from '../../actions/OtpActions'
import { toggleAccountBalanceVisibility, updateActiveWalletsOrder, updateArchivedWalletsOrder } from '../../actions/WalletListActions'
import { walletRowOption } from '../../actions/WalletOptionsActions.js'
import WalletList from '../../components/scenes/WalletListScene'
import type { Dispatch, State } from '../../modules/ReduxTypes'
import * as SETTINGS_SELECTORS from '../../modules/Settings/selectors'
import * as UI_SELECTORS from '../../modules/UI/selectors.js'

const mapStateToProps = (state: State) => {
  const coreWallets = state.core.wallets.byId
  const wallets = state.ui.wallets.byId
  const activeWalletIds = UI_SELECTORS.getActiveWalletIds(state)
  const archivedWalletIds = UI_SELECTORS.getArchivedWalletIds(state)
  const walletArchivesVisible = state.ui.scenes.walletList.walletArchivesVisible
  // $FlowFixMe
  const dimensions = state.ui.scenes.dimensions
  const customTokens = state.ui.settings.customTokens
  const otpResetPending = SETTINGS_SELECTORS.getOtpResetPending(state)
  const defaultFiat = SETTINGS_SELECTORS.getDefaultFiat(state)

  const supportedWalletTypes = SETTINGS_SELECTORS.getSupportedWalletTypes(state)
  const ethereumWalletType = supportedWalletTypes.find(item => item.value === 'wallet:ethereum')

  return {
    coreWallets,
    wallets,
    activeWalletIds,
    archivedWalletIds,
    walletArchivesVisible,
    dimensions,
    customTokens,
    otpResetPending,
    defaultFiat,
    ethereumWalletType
  }
}

const mapDispatchToProps = (dispatch: Dispatch, state: State) => ({
  updateActiveWalletsOrder: activeWalletIds => dispatch(updateActiveWalletsOrder(activeWalletIds)),
  updateArchivedWalletsOrder: archivedWalletIds => dispatch(updateArchivedWalletsOrder(archivedWalletIds)),
  // $FlowFixMe
  walletRowOption: (walletId, option, archived) => dispatch(walletRowOption(walletId, option, archived)),
  disableOtp: () => dispatch(disableOtp()),
  keepOtp: () => dispatch(keepOtp()),
  toggleAccountBalanceVisibility: () => dispatch(toggleAccountBalanceVisibility())
})

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(WalletList)
