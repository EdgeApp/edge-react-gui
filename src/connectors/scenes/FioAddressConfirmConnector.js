// @flow

import { connect } from 'react-redux'

import type { StateProps } from '../../components/scenes/FioAddressConfirmScene'
import { FioAddressConfirmScene } from '../../components/scenes/FioAddressConfirmScene'
import { FIO_STR } from '../../constants/WalletAndCurrencyConstants'
import { getDisplayDenomination } from '../../modules/Settings/selectors'
import type { State } from '../../types/reduxTypes'

const mapStateToProps = (state: State) => {
  const displayDenomination = getDisplayDenomination(state, FIO_STR)

  const out: StateProps = {
    denominationMultiplier: displayDenomination.multiplier,
    isConnected: state.network.isConnected
  }
  return out
}

export const FioAddressConfirmConnector = connect(mapStateToProps, {})(FioAddressConfirmScene)
