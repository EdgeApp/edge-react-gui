// @flow

import type { EdgeCurrencyWallet } from 'edge-core-js'
import { connect } from 'react-redux'

import type { DispatchProps, StateProps } from '../../components/scenes/FioAddressRegisterScene'
import { FioAddressRegisterScene } from '../../components/scenes/FioAddressRegisterScene'
import * as Constants from '../../constants/indexConstants'
import { createFioWallet } from '../../modules/FioAddress/action'
import { getFioWallets } from '../../modules/UI/selectors'
import type { Dispatch, State } from '../../types/reduxTypes'

const mapStateToProps = (state: State) => {
  const { account } = state.core
  if (!account || !account.currencyConfig) {
    return {
      fioWallets: [],
      fioPlugin: {},
      isConnected: state.network.isConnected
    }
  }
  const fioWallets: EdgeCurrencyWallet[] = getFioWallets(state)
  const fioPlugin = account.currencyConfig[Constants.CURRENCY_PLUGIN_NAMES.FIO]

  const out: StateProps = {
    fioWallets,
    fioPlugin,
    isConnected: state.network.isConnected
  }
  return out
}

const mapDispatchToProps = (dispatch: Dispatch): DispatchProps => ({
  createFioWallet: () => dispatch(createFioWallet())
})

export const FioAddressRegisterConnector = connect(mapStateToProps, mapDispatchToProps)(FioAddressRegisterScene)
