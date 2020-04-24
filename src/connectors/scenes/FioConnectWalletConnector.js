// @flow

import { connect } from 'react-redux'

import type { FioConnectWalletStateProps as StateProps } from '../../components/scenes/FioConnectWalletScene'
import { FioConnectWalletScene } from '../../components/scenes/FioConnectWalletScene'
import { makeNotConnectedWallets } from '../../modules/FioAddress/util'
import { getFioWallets, getWallets } from '../../modules/UI/selectors'
import type { State } from '../../types/reduxTypes'

const mapStateToProps = (state: State, ownProps): StateProps => {
  const wallets = getWallets(state)
  const fioWallets = getFioWallets(state)
  const connectedPubAddresses = state.ui.fio.connectedPubAddresses[ownProps.fioAddressName]

  if (!connectedPubAddresses) return { fioWallets, loading: true }

  const notConnectedWallets = makeNotConnectedWallets(wallets, connectedPubAddresses)

  const out: StateProps = {
    notConnectedWallets,
    fioWallets,
    loading: false
  }
  return out
}

export const FioConnectWalletConnector = connect(mapStateToProps)(FioConnectWalletScene)
