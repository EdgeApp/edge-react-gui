// @flow

import { type EdgeCurrencyWallet } from 'edge-core-js'
import { connect } from 'react-redux'

import type { DispatchProps, StateProps } from '../../components/scenes/FioAddressConfirmScene'
import { FioAddressConfirmScene } from '../../components/scenes/FioAddressConfirmScene'
import { isConnectedState } from '../../modules/Core/selectors'
import type { Dispatch, State } from '../../types/reduxTypes'

const mapStateToProps = (state: State) => {
  const { fioAddress } = state.ui.scenes

  const out: StateProps = {
    fioAddressName: fioAddress.fioAddressName,
    isConnected: isConnectedState(state)
  }
  return out
}

const mapDispatchToProps = (dispatch: Dispatch): DispatchProps => ({
  changeConfirmSelectedWallet: (selectedWallet: EdgeCurrencyWallet | null, expiration: string, feeCollected: number) =>
    dispatch({
      type: 'FIO/FIO_ADDRESS_UPDATE_SELECTED_WALLET',
      data: { selectedWallet, expiration, feeCollected }
    })
})

export const FioAddressConfirmConnector = connect(
  mapStateToProps,
  mapDispatchToProps
)(FioAddressConfirmScene)
