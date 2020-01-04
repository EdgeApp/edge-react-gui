// @flow

import { connect } from 'react-redux'

import type { OwnProps, StateProps } from '../../components/common/CryptoExchangeWalletListRow.js'
import { CryptoExchangeWalletListRow } from '../../components/common/CryptoExchangeWalletListRow.js'
import { getDisplayDenomination } from '../../modules/Settings/selectors.js'
import type { State } from '../../types/reduxTypes.js'

const mapStateToProps = (state: State, ownProps: OwnProps): StateProps => {
  return {
    denomination: getDisplayDenomination(state, ownProps.wallet.currencyCode),
    customTokens: state.ui.settings.customTokens,
    settings: state.ui.settings,
    exchangeRates: state.exchangeRates
  }
}

const CryptoExchangeWalletListTokenRowConnected = connect(mapStateToProps)(CryptoExchangeWalletListRow)

export { CryptoExchangeWalletListTokenRowConnected }
