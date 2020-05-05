// @flow

import { connect } from 'react-redux'

import type {
  FioDisconnectWalletsDispatchProps as DispatchProps,
  FioDisconnectWalletsStateProps as StateProps
} from '../../components/scenes/FioDisconnectWalletScene'
import { FioDisconnectWalletScene } from '../../components/scenes/FioDisconnectWalletScene'
import { isConnectedState } from '../../modules/Core/selectors'
import { makeConnectedWallets } from '../../modules/FioAddress/util'
import { getWallets } from '../../modules/UI/selectors'
import type { CcWalletMap } from '../../reducers/FioReducer'
import type { Dispatch, State } from '../../types/reduxTypes'

const mapStateToProps = (state: State, ownProps): StateProps => {
  const wallets = getWallets(state)
  const ccWalletMap = state.ui.fio.connectedWalletsByFioAddress[ownProps.fioAddressName]
  if (!ccWalletMap) {
    return {
      ccWalletMap,
      isConnected: isConnectedState(state)
    }
  }
  const connectedWallets = makeConnectedWallets(wallets, ccWalletMap)

  const out: StateProps = {
    ccWalletMap,
    connectedWallets,
    isConnected: isConnectedState(state)
  }
  return out
}

const mapDispatchToProps = (dispatch: Dispatch): DispatchProps => ({
  updateConnectedWallets: (fioAddress: string, ccWalletMap: CcWalletMap) => {
    dispatch({
      type: 'FIO/UPDATE_CONNECTED_WALLETS_FOR_FIO_ADDRESS',
      data: {
        fioAddress,
        ccWalletMap
      }
    })
  }
})

export const FioDisconnectWalletsConnector = connect(
  mapStateToProps,
  mapDispatchToProps
)(FioDisconnectWalletScene)
