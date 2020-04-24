// @flow

import { connect } from 'react-redux'

import type {
  FioConnectWalletConfirmDispatchProps as DispatchProps,
  FioConnectWalletConfirmStateProps as StateProps
} from '../../components/scenes/FioConnectWalletConfirmScene'
import { FioConnectWalletConfirmScene } from '../../components/scenes/FioConnectWalletConfirmScene'
import { isConnectedState } from '../../modules/Core/selectors'
import type { Dispatch, State } from '../../types/reduxTypes'

const mapStateToProps = (state: State, ownProps) => {
  const pubAddresses = state.ui.fio.connectedPubAddresses[ownProps.fioAddressName]
  const out: StateProps = {
    pubAddresses,
    isConnected: isConnectedState(state)
  }
  return out
}

const mapDispatchToProps = (dispatch: Dispatch): DispatchProps => ({
  updatePubAddresses: (fioAddress: string, pubAddresses: { [fullCurrencyCode: string]: string }) => {
    dispatch({
      type: 'FIO/UPDATE_PUB_ADDRESSES_FOR_FIO_ADDRESS',
      data: {
        fioAddress,
        pubAddresses
      }
    })
  }
})

export const FioConnectWalletConfirmConnector = connect(
  mapStateToProps,
  mapDispatchToProps
)(FioConnectWalletConfirmScene)
