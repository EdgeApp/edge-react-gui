// @flow

import { connect } from 'react-redux'

import type { DispatchProps, StateProps } from '../../components/scenes/FioDomainSettingsScene'
import { FioDomainSettingsScene } from '../../components/scenes/FioDomainSettingsScene'
import { FIO_STR } from '../../constants/WalletAndCurrencyConstants'
import { refreshAllFioAddresses } from '../../modules/FioAddress/action'
import { getDisplayDenomination } from '../../modules/Settings/selectors'
import type { Dispatch, State } from '../../types/reduxTypes'

const mapStateToProps = (state: State) => {
  const displayDenomination = getDisplayDenomination(state, FIO_STR)

  const out: StateProps = {
    denominationMultiplier: displayDenomination.multiplier,
    isConnected: state.network.isConnected
  }

  return out
}

const mapDispatchToProps = (dispatch: Dispatch): DispatchProps => ({
  refreshAllFioAddresses: () => {
    dispatch(refreshAllFioAddresses())
  }
})

export const FioDomainSettingsConnector = connect(mapStateToProps, mapDispatchToProps)(FioDomainSettingsScene)
