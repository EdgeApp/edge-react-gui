// @flow

import { type EdgeCurrencyWallet } from 'edge-core-js'
import { connect } from 'react-redux'

import { createCurrencyWallet } from '../../actions/CreateWalletActions.js'
import type { DispatchProps, StateProps } from '../../components/scenes/FioAddressRegisterScene'
import { FioAddressRegisterScene } from '../../components/scenes/FioAddressRegisterScene'
import { isConnectedState } from '../../modules/Core/selectors'
import * as SETTINGS_SELECTORS from '../../modules/Settings/selectors'
import { getFioWallets } from '../../modules/UI/selectors'
import type { Dispatch, State } from '../../types/reduxTypes'

const mapStateToProps = (state: State) => {
  const fioWallets: EdgeCurrencyWallet[] = getFioWallets(state)
  const defaultFiatCode = SETTINGS_SELECTORS.getDefaultIsoFiat(state)

  const out: StateProps = {
    fioWallets,
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
