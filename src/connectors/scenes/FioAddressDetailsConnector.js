// @flow

import { connect } from 'react-redux'

import type { StateProps } from '../../components/scenes/FioAddressDetailsScene'
import { FioAddressDetailsScene } from '../../components/scenes/FioAddressDetailsScene'
import { makeNotConnectedWallets } from '../../modules/FioAddress/util'
import { getFioWallets, getWallets } from '../../modules/UI/selectors'
import type { State } from '../../types/reduxTypes'

const mapStateToProps = (state: State, ownProps) => {
  const wallets = getWallets(state)
  const fioWallets = getFioWallets(state)
  const ccWalletMap = state.ui.fio.connectedWalletsByFioAddress[ownProps.fioAddressName]

  if (!ccWalletMap) return { fioWallets, loading: true }

  const notConnectedWallets = makeNotConnectedWallets(wallets, ccWalletMap)

  const out: StateProps = {
    notConnectedWallets,
    fioWallets,
    loading: false
  }
  return out
}

export const FioAddressDetailsConnector = connect(mapStateToProps, {})(FioAddressDetailsScene)
