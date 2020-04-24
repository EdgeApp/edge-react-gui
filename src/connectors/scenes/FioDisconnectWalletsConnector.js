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
import type { Dispatch, State } from '../../types/reduxTypes'

const mapStateToProps = (state: State, ownProps): StateProps => {
  const wallets = getWallets(state)
  const pubAddresses = state.ui.fio.connectedPubAddresses[ownProps.fioAddressName]
  if (!pubAddresses) {
    return {
      pubAddresses,
      isConnected: isConnectedState(state)
    }
  }
  const connectedWallets = makeConnectedWallets(wallets, pubAddresses)

  const out: StateProps = {
    pubAddresses,
    connectedWallets,
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

export const FioDisconnectWalletsConnector = connect(
  mapStateToProps,
  mapDispatchToProps
)(FioDisconnectWalletScene)
