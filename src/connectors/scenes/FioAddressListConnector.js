// @flow

import { type EdgeCurrencyWallet } from 'edge-core-js'
import { connect } from 'react-redux'

import type { DispatchProps, StateProps } from '../../components/scenes/FioAddressListScene'
import { FioAddressListScene } from '../../components/scenes/FioAddressListScene'
import { isConnectedState } from '../../modules/Core/selectors'
import { getFioWallets } from '../../modules/UI/selectors'
import type { Dispatch, State } from '../../types/reduxTypes'

const mapStateToProps = (state: State) => {
  const fioWallets: EdgeCurrencyWallet[] = getFioWallets(state)

  const out: StateProps = {
    fioWallets,
    isConnected: isConnectedState(state)
  }
  return out
}

const mapDispatchToProps = (dispatch: Dispatch): DispatchProps => ({
  setFioAddress: (fioAddressName: string, expiration: string) =>
    dispatch({
      type: 'FIO/FIO_ADDRESS_SET_FIO_ADDRESS',
      data: { fioAddressName, expiration }
    })
})

export const FioAddressListConnector = connect(
  mapStateToProps,
  mapDispatchToProps
)(FioAddressListScene)
