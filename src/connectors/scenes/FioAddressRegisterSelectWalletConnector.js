// @flow

import type { EdgeCurrencyWallet } from 'edge-core-js'
import { connect } from 'react-redux'

import type { DispatchProps, StateProps } from '../../components/scenes/FioAddressRegisterSelectWalletScene'
import { FioAddressRegisterSelectWalletScene } from '../../components/scenes/FioAddressRegisterSelectWalletScene'
import { getRegInfo } from '../../modules/FioAddress/action'
import * as SETTINGS_SELECTORS from '../../modules/Settings/selectors'
import { getFioWallets } from '../../modules/UI/selectors'
import type { Dispatch, State } from '../../types/reduxTypes'
import type { FioDomain } from '../../types/types'

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
    isConnected: state.network.isConnected
  }
  return out
}

const mapDispatchToProps = (dispatch: Dispatch): DispatchProps => ({
  getRegInfo: (fioAddress: string, selectedWallet: EdgeCurrencyWallet, selectedDomain: FioDomain) =>
    dispatch(getRegInfo(fioAddress, selectedWallet, selectedDomain)),
  onSelectWallet: (walletId: string, currencyCode: string) => {
    dispatch({ type: 'UI/WALLETS/SELECT_WALLET', data: { currencyCode: currencyCode, walletId: walletId } })
  }
})

export const FioAddressRegisterSelectWalletConnector = connect(mapStateToProps, mapDispatchToProps)(FioAddressRegisterSelectWalletScene)
