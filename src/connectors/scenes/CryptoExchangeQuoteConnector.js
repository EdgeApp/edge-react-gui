// @flow
import { connect } from 'react-redux'

import { exchangeTimerExpired, shiftCryptoCurrency } from '../../actions/indexActions.js'
import { CryptoExchangeQuoteScreenComponent, type DispatchProps, type OwnProps, type StateProps } from '../../components/scenes/CryptoExchangeQuoteScene'
import * as CORE_SELECTORS from '../../modules/Core/selectors'
import type { Dispatch, State } from '../../types/reduxTypes.js'
import { type GuiSwapInfo } from '../../types/types.js'

export const mapStateToProps = (state: State, ownProps: OwnProps): StateProps => {
  const { request } = ownProps.swapInfo

  const account = CORE_SELECTORS.getAccount(state)
  const fromWallet = state.cryptoExchange.fromWallet
  const toWallet = state.cryptoExchange.toWallet

  const toWalletCurrencyName = toWallet != null ? toWallet.currencyNames[request.toCurrencyCode] : ''
  const fromWalletCurrencyName = fromWallet != null ? fromWallet.currencyNames[request.fromCurrencyCode] : ''

  return {
    account,
    fromCurrencyIcon: state.cryptoExchange.fromCurrencyIcon || '',
    fromDenomination: state.cryptoExchange.fromWalletPrimaryInfo.displayDenomination.name,
    fromWalletCurrencyName,
    pending: state.cryptoExchange.shiftPendingTransaction,
    toCurrencyIcon: state.cryptoExchange.toCurrencyIcon || '',
    toDenomination: state.cryptoExchange.toWalletPrimaryInfo.displayDenomination.name,
    toWalletCurrencyName
  }
}

export const mapDispatchToProps = (dispatch: Dispatch): DispatchProps => ({
  shift (swapInfo: GuiSwapInfo) {
    dispatch(shiftCryptoCurrency(swapInfo))
  },
  timeExpired (swapInfo: GuiSwapInfo) {
    dispatch(exchangeTimerExpired(swapInfo))
  }
})

const CryptoExchangeQuoteConnector = connect(
  mapStateToProps,
  mapDispatchToProps
)(CryptoExchangeQuoteScreenComponent)

export { CryptoExchangeQuoteConnector }
