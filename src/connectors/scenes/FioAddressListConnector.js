// @flow

import type { EdgeCurrencyWallet } from 'edge-core-js'
import { connect } from 'react-redux'

import type { DispatchProps, StateProps } from '../../components/scenes/FioAddressListScene'
import { FioAddressListScene } from '../../components/scenes/FioAddressListScene'
import * as Constants from '../../constants/indexConstants'
import { getAccount, isConnectedState } from '../../modules/Core/selectors'
import { refreshAllFioAddresses } from '../../modules/FioAddress/action'
import { getFioWallets } from '../../modules/UI/selectors'
import type { Dispatch, State } from '../../types/reduxTypes'
import type { FioAddress } from '../../types/types'

const mapStateToProps = (state: State) => {
  const account = getAccount(state)
  const fioAddresses: FioAddress[] = state.ui.scenes.fioAddress.fioAddresses
  const fioWallets: EdgeCurrencyWallet[] = getFioWallets(state)
  const loading: boolean = state.ui.scenes.fioAddress.fioAddressesLoading
  const fioPlugin = account.currencyConfig ? account.currencyConfig[Constants.CURRENCY_PLUGIN_NAMES.FIO] : null

  const out: StateProps = {
    fioAddresses,
    fioWallets,
    fioPlugin,
    loading,
    isConnected: isConnectedState(state)
  }
  return out
}

const mapDispatchToProps = (dispatch: Dispatch): DispatchProps => ({
  setFioAddress: (fioAddressName: string, expiration: string) =>
    dispatch({
      type: 'FIO/FIO_ADDRESS_SET_FIO_ADDRESS',
      data: { fioAddressName, expiration }
    }),
  refreshAllFioAddresses: () => dispatch(refreshAllFioAddresses())
})

export const FioAddressListConnector = connect(
  mapStateToProps,
  mapDispatchToProps
)(FioAddressListScene)
