// @flow

import { connect } from 'react-redux'

import { hideMessageTweak } from '../../actions/AccountReferralActions.js'
import { createCurrencyWallet } from '../../actions/CreateWalletActions.js'
import { disableOtp, keepOtp } from '../../actions/OtpActions'
import { toggleAccountBalanceVisibility, updateActiveWalletsOrder, updateArchivedWalletsOrder } from '../../actions/WalletListActions'
import { walletRowOption } from '../../actions/WalletOptionsActions.js'
import WalletList from '../../components/scenes/WalletListScene'
import * as SETTINGS_SELECTORS from '../../modules/Settings/selectors'
import * as UI_SELECTORS from '../../modules/UI/selectors.js'
import type { Dispatch, State } from '../../types/reduxTypes.js'
import { type TweakSource } from '../../util/ReferralHelpers.js'

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

  const supportedWalletTypes = SETTINGS_SELECTORS.getSupportedWalletTypes(state)
  const ethereumWalletType = supportedWalletTypes.find(item => item.value === 'wallet:ethereum')
  const exchangeRates = state.exchangeRates
  return {
    coreWallets,
    accountMessages: state.account.referralCache.accountMessages,
    accountReferral: state.account.accountReferral,
    wallets,
    activeWalletIds,
    archivedWalletIds,
    walletArchivesVisible,
    dimensions,
    customTokens,
    otpResetPending,
    ethereumWalletType,
    exchangeRates
  }
}

const mapDispatchToProps = (dispatch: Dispatch, state: State) => ({
  updateActiveWalletsOrder: activeWalletIds => dispatch(updateActiveWalletsOrder(activeWalletIds)),
  updateArchivedWalletsOrder: archivedWalletIds => dispatch(updateArchivedWalletsOrder(archivedWalletIds)),
  // $FlowFixMe
  walletRowOption: (walletId, option, archived) => dispatch(walletRowOption(walletId, option, archived)),
  disableOtp: () => dispatch(disableOtp()),
  keepOtp: () => dispatch(keepOtp()),
  hideMessageTweak (messageId: string, source: TweakSource) {
    dispatch(hideMessageTweak(messageId, source))
  },
  toggleAccountBalanceVisibility: () => dispatch(toggleAccountBalanceVisibility()),
  createCurrencyWallet: (walletName: string, walletType: string, fiatCurrencyCode: string, isScenePop: boolean, selectWallet: boolean, importText?: string) =>
    dispatch(createCurrencyWallet(walletName, walletType, fiatCurrencyCode, isScenePop, false, importText))
})

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(WalletList)
