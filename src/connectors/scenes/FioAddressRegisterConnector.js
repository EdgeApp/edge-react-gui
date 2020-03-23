// @flow

import { connect } from 'react-redux'

import { createCurrencyWallet } from '../../actions/CreateWalletActions.js'
import type { DispatchProps, StateProps } from '../../components/scenes/FioAddressRegisterScene'
import { FioAddressRegisterScene } from '../../components/scenes/FioAddressRegisterScene'
import * as Constants from '../../constants/indexConstants'
import { getAccount, isConnectedState } from '../../modules/Core/selectors'
import * as SETTINGS_SELECTORS from '../../modules/Settings/selectors'
import type { Dispatch, State } from '../../types/reduxTypes'

const mapStateToProps = (state: State) => {
  const defaultFiatCode = SETTINGS_SELECTORS.getDefaultIsoFiat(state)
  const account = getAccount(state)
  const currencyPluginName = Constants.CURRENCY_PLUGIN_NAMES[Constants.FIO_STR]
  const fioPlugin = account.currencyConfig[currencyPluginName]

  const out: StateProps = {
    fioPlugin,
    defaultFiatCode,
    isConnected: isConnectedState(state)
  }
  return out
}

const mapDispatchToProps = (dispatch: Dispatch): DispatchProps => ({
  changeFioAddressName: (fioAddressName: string) =>
    dispatch({
      type: 'FIO/FIO_ADDRESS_UPDATE_FIO_ADDRESS_NAME',
      data: { fioAddressName }
    }),
  createCurrencyWallet: (walletName: string, walletType: string, fiatCurrencyCode: string) =>
    dispatch(createCurrencyWallet(walletName, walletType, fiatCurrencyCode, false, false))
})

export const FioAddressRegisterConnector = connect(
  mapStateToProps,
  mapDispatchToProps
)(FioAddressRegisterScene)
