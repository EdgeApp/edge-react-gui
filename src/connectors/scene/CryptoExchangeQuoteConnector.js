// @flow
import { connect } from 'react-redux'

import { exchangeTimerExpired, shiftCryptoCurrency } from '../../actions/indexActions.js'
import type { Dispatch, State } from '../../modules/ReduxTypes'
import { CryptoExchangeQuoteScreenComponent } from '../../modules/UI/scenes/CryptoExchange/CryptoExchangeQuoteScreenComponent'
import type { OwnProps } from '../../modules/UI/scenes/CryptoExchange/CryptoExchangeQuoteScreenComponent'

/* import type { GuiWallet } from '../../types.js' */

export const mapStateToProps = (state: State, ownProps: OwnProps) => {
  const fromWallet = state.cryptoExchange.fromWallet
  const toWallet = state.cryptoExchange.toWallet
  const quote = ownProps.quote
  return {
    fromWallet,
    fromNativeAmount: quote.fromNativeAmount,
    fromCurrencyCode: quote.fromCurrencyCode,
    fromBalanceInFiat: quote.fromFiat,
    fromCurrencyIcon: state.cryptoExchange.fromCurrencyIcon || '',
    fromDisplayAmount: quote.fromDisplayAmount,
    toWallet,
    toCurrencyCode: quote.toCurrencyCode,
    toNativeAmount: quote.toNativeAmount,
    toBalanceInFiat: quote.toFiat,
    toDisplayAmount: quote.toDisplayAmount,
    toCurrencyIcon: state.cryptoExchange.toCurrencyIcon || '',
    pending: state.cryptoExchange.shiftPendingTransaction,
    fee: quote.fee,
    quoteExpireDate: quote.quoteExpireDate
  }
}

export const mapDispatchToProps = (dispatch: Dispatch) => ({
  shift: () => dispatch(shiftCryptoCurrency()),
  timeExpired: () => dispatch(exchangeTimerExpired())
})

const CryptoExchangeQuoteConnector = connect(
  mapStateToProps,
  mapDispatchToProps
)(CryptoExchangeQuoteScreenComponent)

export { CryptoExchangeQuoteConnector }
