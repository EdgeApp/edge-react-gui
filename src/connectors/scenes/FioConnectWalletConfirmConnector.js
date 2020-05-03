// @flow

import { connect } from 'react-redux'

import type {
  FioConnectWalletConfirmDispatchProps as DispatchProps,
  FioConnectWalletConfirmStateProps as StateProps
} from '../../components/scenes/FioConnectWalletConfirmScene'
import { FioConnectWalletConfirmScene } from '../../components/scenes/FioConnectWalletConfirmScene'
import { isConnectedState } from '../../modules/Core/selectors'
import type { CcWalletMap } from '../../reducers/FioReducer'
import type { Dispatch, State } from '../../types/reduxTypes'

const mapStateToProps = (state: State, ownProps) => {
  const ccWalletMap = state.ui.fio.connectedWalletsByFioAddress[ownProps.fioAddressName]
  const out: StateProps = {
    ccWalletMap,
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

export const FioConnectWalletConfirmConnector = connect(
  mapStateToProps,
  mapDispatchToProps
)(FioConnectWalletConfirmScene)
