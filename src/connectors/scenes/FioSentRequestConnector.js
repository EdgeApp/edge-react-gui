// @flow

import { connect } from 'react-redux'

import type { FioSentRequestDetailsProps as StateProps } from '../../components/scenes/FioSentRequestDetailsScene'
import { FioSentRequestDetailsComponent } from '../../components/scenes/FioSentRequestDetailsScene'
import * as UI_SELECTORS from '../../modules/UI/selectors.js'
import type { State } from '../../types/reduxTypes'

const mapStateToProps = (state: State) => {
  const wallet = UI_SELECTORS.getSelectedWallet(state)
  const isoFiatCurrencyCode = wallet.isoFiatCurrencyCode
  const selectedFioSentRequest = UI_SELECTORS.getFioSelectedSentRequest(state)
  const exchangeRates = state.exchangeRates

  const out: StateProps = {
    exchangeRates,
    selectedFioSentRequest,
    isoFiatCurrencyCode
  }
  return out
}

export const FioSentRequestConnector = connect(
  mapStateToProps,
  {}
)(FioSentRequestDetailsComponent)
