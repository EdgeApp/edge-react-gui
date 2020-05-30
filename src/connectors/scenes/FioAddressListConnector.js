// @flow

import type { EdgeCurrencyWallet } from 'edge-core-js'
import { connect } from 'react-redux'

import type { DispatchProps, StateProps } from '../../components/scenes/FioAddressListScene'
import { FioAddressListScene } from '../../components/scenes/FioAddressListScene'
import * as Constants from '../../constants/indexConstants'
import { refreshAllFioAddresses } from '../../modules/FioAddress/action'
import { getFioWallets } from '../../modules/UI/selectors'
import type { Dispatch, State } from '../../types/reduxTypes'
import type { FioAddress, FioDomain } from '../../types/types'

const mapStateToProps = (state: State) => {
  const { account } = state.core
  const fioAddresses: FioAddress[] = state.ui.scenes.fioAddress.fioAddresses
  const fioDomains: FioDomain[] = state.ui.scenes.fioAddress.fioDomains
  const fioWallets: EdgeCurrencyWallet[] = getFioWallets(state)
  const loading: boolean = state.ui.scenes.fioAddress.fioAddressesLoading
  const fioPlugin = account.currencyConfig ? account.currencyConfig[Constants.CURRENCY_PLUGIN_NAMES.FIO] : null

  const out: StateProps = {
    fioAddresses,
    fioDomains,
    fioWallets,
    fioPlugin,
    loading,
    isConnected: state.network.isConnected
  }
  return out
}

const mapDispatchToProps = (dispatch: Dispatch): DispatchProps => ({
  refreshAllFioAddresses: () => dispatch(refreshAllFioAddresses())
})

export const FioAddressListConnector = connect(mapStateToProps, mapDispatchToProps)(FioAddressListScene)
