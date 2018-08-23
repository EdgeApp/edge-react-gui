// @flow

import { connect } from 'react-redux'

import s from '../../locales/strings.js'
import type { State } from '../../modules/ReduxTypes'
import LinkedComponent from '../../modules/UI/components/CryptoExchangeRate/CryptoExchangeRate'

export const mapStateToProps = (state: State, ownProps: Object) => {
  const fromCurrencyCode = state.cryptoExchange.fromCurrencyCode
  const exchangeRate = state.cryptoExchange.exchangeRate
  const toCurrencyCode = state.cryptoExchange.toCurrencyCode
  const insufficient = state.cryptoExchange.insufficientError
  const genericError = state.cryptoExchange.genericShapeShiftError
  let exchangeRateString = ''
  if (fromCurrencyCode && toCurrencyCode) {
    exchangeRateString = '1 ' + fromCurrencyCode + ' = ' + exchangeRate + ' ' + toCurrencyCode
    if (insufficient) {
      exchangeRateString = s.strings.fragment_insufficient_funds
    }
    if (genericError) {
      exchangeRateString = genericError
    }
  }
  return {
    style: ownProps.style,
    exchangeRate: exchangeRateString,
    insufficient,
    genericError
  }
}

export const mapDispatchToProps = () => ({})

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(LinkedComponent)
