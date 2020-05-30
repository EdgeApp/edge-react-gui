// @flow

import type { EdgeCurrencyWallet } from 'edge-core-js'
import { connect } from 'react-redux'

import type { DispatchProps, StateProps } from '../../components/scenes/FioAddressRegisterSelectWalletScene'
import { FioAddressRegisterSelectWalletScene } from '../../components/scenes/FioAddressRegisterSelectWalletScene'
import * as Constants from '../../constants/WalletAndCurrencyConstants'
import * as SETTINGS_SELECTORS from '../../modules/Settings/selectors'
import { getFioWallets } from '../../modules/UI/selectors'
import type { Dispatch, State } from '../../types/reduxTypes'

const mapStateToProps = (state: State) => {
  const wallets = state.ui.wallets.byId
  const fioWallets: EdgeCurrencyWallet[] = getFioWallets(state)
  const { account } = state.core
  const fioPlugin = account.currencyConfig[Constants.CURRENCY_PLUGIN_NAMES.FIO]
  const fioDisplayDenomination = SETTINGS_SELECTORS.getDisplayDenomination(state, Constants.FIO_STR)

  const defaultFiatCode = SETTINGS_SELECTORS.getDefaultIsoFiat(state)

  const out: StateProps = {
    state,
    fioWallets,
    fioPlugin,
    fioDisplayDenomination,
    defaultFiatCode,
    wallets,
    isConnected: state.network.isConnected
  }
  return out
}

const mapDispatchToProps = (dispatch: Dispatch): DispatchProps => ({
  onSelectWallet: (walletId: string, currencyCode: string) => {
    dispatch({ type: 'UI/WALLETS/SELECT_WALLET', data: { currencyCode: currencyCode, walletId: walletId } })
  }
})

export const FioAddressRegisterSelectWalletConnector = connect(mapStateToProps, mapDispatchToProps)(FioAddressRegisterSelectWalletScene)
