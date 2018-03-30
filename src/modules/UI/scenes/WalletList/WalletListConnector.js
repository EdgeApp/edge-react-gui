// @flow
import { connect } from 'react-redux'

import * as CORE_SELECTORS from '../../../Core/selectors.js'
import type { Dispatch, State } from '../../../ReduxTypes'
import * as UI_SELECTORS from '../../selectors.js'
import * as SETTINGS_SELECTORS from '../../Settings/selectors'
import { updateActiveWalletsOrder, updateArchivedWalletsOrder } from './action'
import { walletRowOption } from './components/WalletOptions/action.js'
import WalletList from './WalletList.ui'
import {disableOtp, keepOtp} from '../../../../actions/OtpActions'

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
  const walletsForProgress = state.ui.wallets.walletLoadingProgress
  const walletKeys = Object.keys(walletsForProgress)
  const numberOfWallets = walletKeys.length
  let progressBeforeDivision = 0
  for (const walletId in walletsForProgress) {
    progressBeforeDivision += walletsForProgress[walletId]
  }
  const progressAfterDivision = progressBeforeDivision / numberOfWallets
  let progressPercentage = 0
  if (numberOfWallets > 0) {
    if (progressAfterDivision > 0.99999) {
      progressPercentage = 100
    } else {
      progressPercentage = parseInt(progressAfterDivision * 100)
    }
  }

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
    progressPercentage
  }
}

const mapDispatchToProps = (dispatch: Dispatch) => ({
  updateActiveWalletsOrder: activeWalletIds => dispatch(updateActiveWalletsOrder(activeWalletIds)),
  updateArchivedWalletsOrder: archivedWalletIds => dispatch(updateArchivedWalletsOrder(archivedWalletIds)),
  // $FlowFixMe
  walletRowOption: (walletId, option, archived) => dispatch(walletRowOption(walletId, option, archived)),
  disableOtp: () => dispatch(disableOtp()),
  keepOtp: () => dispatch(keepOtp())
})

export default connect(mapStateToProps, mapDispatchToProps)(WalletList)
