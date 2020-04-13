// @flow

import { connect } from 'react-redux'

import type { FioSentRequestDetailsProps as StateProps } from '../../components/scenes/FioSentRequestDetailsScene'
import { FioSentRequestDetailsComponent } from '../../components/scenes/FioSentRequestDetailsScene'
import { FIAT_CODES_SYMBOLS } from '../../constants/WalletAndCurrencyConstants'
import * as UI_SELECTORS from '../../modules/UI/selectors.js'
import type { State } from '../../types/reduxTypes'

const mapStateToProps = (state: State) => {
  const wallet = UI_SELECTORS.getSelectedWallet(state)
  const isoFiatCurrencyCode = wallet.isoFiatCurrencyCode
  const exchangeRates = state.exchangeRates
  const fiatSymbol = FIAT_CODES_SYMBOLS[wallet.fiatCurrencyCode]

  const out: StateProps = {
    exchangeRates,
    fiatSymbol,
    isoFiatCurrencyCode
  }
  return out
}

export const FioSentRequestConnector = connect(
  mapStateToProps,
  {}
)(FioSentRequestDetailsComponent)
