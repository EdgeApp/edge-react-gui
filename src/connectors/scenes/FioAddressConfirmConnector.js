// @flow

import { type EdgeCurrencyWallet } from 'edge-core-js'
import { connect } from 'react-redux'

import { createCurrencyWallet } from '../../actions/CreateWalletActions.js'
import type { DispatchProps, StateProps } from '../../components/scenes/FioAddressConfirmScene'
import { FioAddressConfirmScene } from '../../components/scenes/FioAddressConfirmScene'
import { getAccount, isConnectedState } from '../../modules/Core/selectors'
import { getFioWallets } from '../../modules/UI/selectors'
import type { Dispatch, State } from '../../types/reduxTypes'

const mapStateToProps = (state: State) => {
  const { fioAddress } = state.ui.scenes
  const fioWallets: EdgeCurrencyWallet[] = getFioWallets(state)
  const account = getAccount(state)

  const out: StateProps = {
    fioAddressName: fioAddress.fioAddressName,
    account,
    fioWallets,
    isConnected: isConnectedState(state)
  }
  return out
}

const mapDispatchToProps = (dispatch: Dispatch): DispatchProps => ({
  createCurrencyWallet: (walletName: string, walletType: string) => dispatch(createCurrencyWallet(walletName, walletType, 'iso:USD', false, false)),
  changeConfirmSelectedWallet: (selectedWallet: EdgeCurrencyWallet | null, expiration: Date, fee_collected: number) =>
    dispatch({
      type: 'FIO/FIO_ADDRESS_UPDATE_SELECTED_WALLET',
      data: { selectedWallet, expiration, fee_collected }
    })
})

export const FioAddressConfirmConnector = connect(
  mapStateToProps,
  mapDispatchToProps
)(FioAddressConfirmScene)
