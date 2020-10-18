// @flow

import { connect } from 'react-redux'

import type {
  FioConnectWalletConfirmDispatchProps as DispatchProps,
  FioConnectWalletConfirmStateProps as StateProps
} from '../../components/scenes/FioConnectWalletConfirmScene'
import { FioConnectWalletConfirmScene } from '../../components/scenes/FioConnectWalletConfirmScene'
import type { CcWalletMap } from '../../reducers/FioReducer'
import { type Dispatch, type RootState } from '../../types/reduxTypes'

const mapStateToProps = (state: RootState, ownProps) => {
  const ccWalletMap = state.ui.fio.connectedWalletsByFioAddress[ownProps.fioAddressName]
  const out: StateProps = {
    ccWalletMap,
    isConnected: state.network.isConnected
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

export const FioConnectWalletConfirmConnector = connect(mapStateToProps, mapDispatchToProps)(FioConnectWalletConfirmScene)
