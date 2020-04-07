// @flow

import type { EdgeCurrencyWallet } from 'edge-core-js'
import { connect } from 'react-redux'

import type { DispatchProps, StateProps } from '../../components/scenes/FioAddressRegisterSelectWalletScene'
import { FioAddressRegisterSelectWalletScene } from '../../components/scenes/FioAddressRegisterSelectWalletScene'
import { isConnectedState } from '../../modules/Core/selectors'
import { getRegInfo } from '../../modules/FioAddress/action'
import * as SETTINGS_SELECTORS from '../../modules/Settings/selectors'
import { getFioWallets } from '../../modules/UI/selectors'
import type { Dispatch, State } from '../../types/reduxTypes'

const mapStateToProps = (state: State) => {
  const wallets = state.ui.wallets.byId
  const fioWallets: EdgeCurrencyWallet[] = getFioWallets(state)
  const handleRegistrationInfo = state.ui.scenes.fioAddress.handleRegistrationInfo
  const paymentInfo = state.ui.scenes.fioAddress.addressRegistrationPaymentInfo
  const loading = state.ui.scenes.fioAddress.regInfoLoading
  const { supportedCurrencies, activationCost } = handleRegistrationInfo

  const defaultFiatCode = SETTINGS_SELECTORS.getDefaultIsoFiat(state)

  const out: StateProps = {
    fioAddress: state.ui.scenes.fioAddress.fioAddressName,
    fioWallets,
    defaultFiatCode,
    paymentInfo,
    supportedCurrencies,
    activationCost,
    wallets,
    loading,
    isConnected: isConnectedState(state)
  }
  return out
}

const mapDispatchToProps = (dispatch: Dispatch): DispatchProps => ({
  getRegInfo: (fioAddress: string, selectedWallet: EdgeCurrencyWallet) => dispatch(getRegInfo(fioAddress, selectedWallet)),
  onSelectWallet: (walletId: string, currencyCode: string) => {
    dispatch({ type: 'UI/WALLETS/SELECT_WALLET', data: { currencyCode: currencyCode, walletId: walletId } })
  }
})

export const FioAddressRegisterSelectWalletConnector = connect(
  mapStateToProps,
  mapDispatchToProps
)(FioAddressRegisterSelectWalletScene)
