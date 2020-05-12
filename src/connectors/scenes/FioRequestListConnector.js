// @flow

import { connect } from 'react-redux'

import type { StateProps } from '../../components/scenes/FioRequestListScene'
import { FioRequestList } from '../../components/scenes/FioRequestListScene'
import { getFioWallets, getSelectedWallet, getWallets } from '../../modules/UI/selectors.js'
import type { State } from '../../types/reduxTypes'

const mapStateToProps = (state: State) => {
  const fioWallets = getFioWallets(state)
  const wallets = getWallets(state)
  const wallet = getSelectedWallet(state)
  if (!wallet) {
    const out: StateProps = {
      wallets: {},
      fioWallets: [],
      isConnected: state.network.isConnected
    }
    return out
  }

  const out: StateProps = {
    wallets,
    fioWallets,
    isConnected: state.network.isConnected
  }
  return out
}

export const FioRequestListConnector = connect(
  mapStateToProps,
  {}
)(FioRequestList)
