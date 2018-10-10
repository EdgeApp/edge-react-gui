// @flow
// import { bns } from 'biggystring'
// import { Actions } from 'react-native-router-flux'
import { connect } from 'react-redux'

import { exchangeTimerExpired, shiftCryptoCurrency } from '../../actions/indexActions.js'
import { intl } from '../../locales/intl'
import { getCurrencyConverter } from '../../modules/Core/selectors.js'
// import {EXCHANGE_QUOTE_PROCESSING_SCENE} from '../../constants/indexConstants.js'
import type { Dispatch, State } from '../../modules/ReduxTypes'
import { CryptoExchangeQuoteScreenComponent } from '../../modules/UI/scenes/CryptoExchange/CryptoExchangeQuoteScreenComponent'
import { getExchangeDenomination as settingsGetExchangeDenomination } from '../../modules/UI/Settings/selectors.js'
import { convertNativeToExchange } from '../../modules/utils'

/* import type { GuiWallet } from '../../types.js' */

export const mapStateToProps = (state: State) => {
  const fromWallet = state.cryptoExchange.fromWallet
  const fromCurrencyCode = state.cryptoExchange.fromWalletPrimaryInfo.displayDenomination.name
  const fromNativeAmount = state.cryptoExchange.fromNativeAmount
  const currencyConverter = getCurrencyConverter(state)
  const fromeExchangeDenomination = fromWallet ? settingsGetExchangeDenomination(state, fromWallet.currencyCode) : ''
  const fromBalanceInCryptoDisplay = fromeExchangeDenomination ? convertNativeToExchange(fromeExchangeDenomination.multiplier)(fromNativeAmount) : ''
  const fromBalanceInFiatRaw = fromWallet
    ? currencyConverter.convertCurrency(fromWallet.currencyCode, fromWallet.isoFiatCurrencyCode, Number(fromBalanceInCryptoDisplay))
    : '0.00'
  const fromBalanceInFiat = intl.formatNumber(fromBalanceInFiatRaw || 0, { toFixed: 2 })

  const toWallet = state.cryptoExchange.toWallet
  const toCurrencyCode = state.cryptoExchange.toWalletPrimaryInfo.displayDenomination.name
  const toNativeAmount = state.cryptoExchange.toNativeAmount
  const toExchangeDenomination = toWallet ? settingsGetExchangeDenomination(state, toWallet.currencyCode) : ''
  const toBalanceInCryptoDisplay = toExchangeDenomination ? convertNativeToExchange(toExchangeDenomination.multiplier)(toNativeAmount) : ''
  const toBalanceInFiatRaw = toWallet
    ? currencyConverter.convertCurrency(toWallet.currencyCode, toWallet.isoFiatCurrencyCode, Number(toBalanceInCryptoDisplay))
    : '0.00'
  const toBalanceInFiat = intl.formatNumber(toBalanceInFiatRaw || 0, { toFixed: 2 })
  const fee = state.cryptoExchange.fee
  const quoteExpireDate = state.cryptoExchange.quoteExpireDate
  return {
    fromWallet,
    fromNativeAmount,
    fromCurrencyCode,
    fromBalanceInFiat,
    fromCurrencyIcon: state.cryptoExchange.fromCurrencyIcon || '',
    fromDisplayAmount: state.cryptoExchange.fromDisplayAmount,
    toWallet,
    toCurrencyCode,
    toNativeAmount,
    toBalanceInFiat,
    toDisplayAmount: state.cryptoExchange.toDisplayAmount,
    toCurrencyIcon: state.cryptoExchange.toCurrencyIcon || '',
    pending: state.cryptoExchange.shiftPendingTransaction,
    fee,
    quoteExpireDate
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
