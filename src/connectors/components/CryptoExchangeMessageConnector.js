// @flow

import { bns } from 'biggystring'
import { connect } from 'react-redux'

import { intl } from '../../locales/intl'
import s from '../../locales/strings.js'
import { getCurrencyConverter } from '../../modules/Core/selectors.js'
import type { State } from '../../modules/ReduxTypes'
import { getDisplayDenomination, getExchangeDenomination as settingsGetExchangeDenomination } from '../../modules/Settings/selectors.js'
import { CryptoExchangeMessageBoxComponent } from '../../modules/UI/components/CryptoExchangeMessageBox/CryptoExchangeMessageBoxComponent'
import { getExchangeDenomination } from '../../modules/UI/selectors.js'
import type { GuiCurrencyInfo } from '../../types'
import { convertNativeToDisplay, convertNativeToExchange, decimalOrZero, getDenomFromIsoCode } from '../../util/utils'

export const mapStateToProps = (state: State, ownProps: Object) => {
  const insufficient = state.cryptoExchange.insufficientError
  const genericError = state.cryptoExchange.genericShapeShiftError
  const fromWallet = state.cryptoExchange.fromWallet
  const fromCurrencyCode = state.cryptoExchange.fromCurrencyCode
  let message = ''
  if (!fromWallet || !fromCurrencyCode) {
    return {
      style: ownProps.style,
      message,
      insufficient,
      genericError
    }
  }
  const currencyConverter = getCurrencyConverter(state)

  const balanceInCrypto = fromWallet.nativeBalances[fromCurrencyCode]
  const isoFiatCurrencyCode = fromWallet.isoFiatCurrencyCode
  const exchangeDenomination = settingsGetExchangeDenomination(state, fromCurrencyCode)
  const balanceInCryptoDisplay = convertNativeToExchange(exchangeDenomination.multiplier)(balanceInCrypto)
  const balanceInFiat = currencyConverter.convertCurrency(fromCurrencyCode, isoFiatCurrencyCode, Number(balanceInCryptoDisplay))

  const displayDenomination = getDisplayDenomination(state, fromCurrencyCode)
  const exchangeCurrencyCode = getExchangeDenomination(state, fromCurrencyCode, fromWallet)
  // const exchangeDenomination = getExchangeDenomination(state, fromCurrencyCode)
  const primaryInfo: GuiCurrencyInfo = {
    displayCurrencyCode: fromCurrencyCode,
    displayDenomination,
    exchangeCurrencyCode: exchangeCurrencyCode.name,
    exchangeDenomination
  }

  const cryptoBalanceAmount: string = convertNativeToDisplay(primaryInfo.displayDenomination.multiplier)(balanceInCrypto) // convert to correct denomination
  const cryptoBalanceAmountString = cryptoBalanceAmount ? intl.formatNumber(decimalOrZero(bns.toFixed(cryptoBalanceAmount, 0, 6), 6)) : '0' // limit decimals and check if infitesimal, also cut off trailing zeroes (to right of significant figures)
  const balanceInFiatString = intl.formatNumber(balanceInFiat || 0, { toFixed: 2 })
  const fiatCurrencyCode = getDenomFromIsoCode(fromWallet.fiatCurrencyCode)
  const fiatDisplayCode = fiatCurrencyCode.symbol
  if (fromCurrencyCode && fiatDisplayCode) {
    message = 'Balance: ' + cryptoBalanceAmountString + ' ' + primaryInfo.displayDenomination.name + ' (' + fiatDisplayCode + ' ' + balanceInFiatString + ')'
    if (insufficient) {
      message = s.strings.fragment_insufficient_funds
    }
    if (genericError) {
      message = genericError
    }
  }
  return {
    style: ownProps.style,
    message,
    insufficient,
    genericError
  }
}

export const mapDispatchToProps = () => ({})

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(CryptoExchangeMessageBoxComponent)
