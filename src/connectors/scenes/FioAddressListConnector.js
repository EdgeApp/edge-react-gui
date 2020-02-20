// @flow

import { connect } from 'react-redux'

import type { DispatchProps, StateProps } from '../../components/scenes/FioAddressListScene'
import { FioAddressListScene } from '../../components/scenes/FioAddressListScene'
import { isConnectedState } from '../../modules/Core/selectors'
import { refreshAllFioAddresses } from '../../modules/FioAddress/action'
import type { Dispatch, State } from '../../types/reduxTypes'
import type { FioAddress } from '../../types/types'

const mapStateToProps = (state: State) => {
  const fioAddresses: FioAddress[] = state.ui.scenes.fioAddress.fioAddresses
  const loading: boolean = state.ui.scenes.fioAddress.fioAddressesLoading

  const out: StateProps = {
    fioAddresses,
    loading,
    isConnected: isConnectedState(state)
  }
  return out
}

const mapDispatchToProps = (dispatch: Dispatch): DispatchProps => ({
  setFioAddress: (fioAddressName: string, expiration: string) =>
    dispatch({
      type: 'FIO/FIO_ADDRESS_SET_FIO_ADDRESS',
      data: { fioAddressName, expiration }
    }),
  refreshAllFioAddresses: (cb: Function) => dispatch(refreshAllFioAddresses(cb))
})

export const FioAddressListConnector = connect(
  mapStateToProps,
  mapDispatchToProps
)(FioAddressListScene)
