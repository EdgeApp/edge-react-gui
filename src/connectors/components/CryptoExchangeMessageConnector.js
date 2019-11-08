// @flow

import { StyleSheet } from 'react-native'
import { connect } from 'react-redux'

import s from '../../locales/strings.js'
import { type Props, CryptoExchangeMessageBoxComponent } from '../../modules/UI/components/CryptoExchangeMessageBox/CryptoExchangeMessageBoxComponent'
import type { State } from '../../types/reduxTypes.js'

type OwnProps = {
  style: StyleSheet.Styles
}

const mapStateToProps = (state: State, ownProps: OwnProps): Props => {
  const insufficient = state.cryptoExchange.insufficientError
  const genericError = state.cryptoExchange.genericShapeShiftError
  const fromWallet = state.cryptoExchange.fromWallet
  const fromCurrencyCode = state.cryptoExchange.fromCurrencyCode

  let useErrorStyle = false
  let message = ''

  if (genericError) {
    useErrorStyle = true
    message = genericError
  } else if (insufficient) {
    useErrorStyle = true
    message = s.strings.fragment_insufficient_funds
  } else if (fromWallet && fromCurrencyCode) {
    message = state.cryptoExchange.fromBalanceMessage
  }

  return {
    style: ownProps.style,
    message,
    useErrorStyle
  }
}

export default connect(
  mapStateToProps,
  null
)(CryptoExchangeMessageBoxComponent)
