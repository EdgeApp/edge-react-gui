// @flow

import { connect } from 'react-redux'

import type { StateProps } from '../../components/scenes/FioAddressConfirmScene'
import { FioAddressConfirmScene } from '../../components/scenes/FioAddressConfirmScene'
import * as Constants from '../../constants/indexConstants'
import { FIO_STR } from '../../constants/WalletAndCurrencyConstants'
import { getDisplayDenomination } from '../../modules/Settings/selectors'
import type { State } from '../../types/reduxTypes'

const mapStateToProps = (state: State) => {
  const { account } = state.core
  const fioPlugin = account.currencyConfig ? account.currencyConfig[Constants.CURRENCY_PLUGIN_NAMES.FIO] : null
  const displayDenomination = getDisplayDenomination(state, FIO_STR)

  const out: StateProps = {
    fioPlugin,
    denominationMultiplier: displayDenomination.multiplier,
    isConnected: state.network.isConnected
  }
  return out
}

export const FioAddressConfirmConnector = connect(mapStateToProps, {})(FioAddressConfirmScene)
