// @flow
import { connect } from 'react-redux'

import { exchangeTimerExpired, shiftCryptoCurrency } from '../../actions/CryptoExchangeActions.js'
import { type DispatchProps, type OwnProps, type StateProps, CryptoExchangeQuoteScreenComponent } from '../../components/scenes/CryptoExchangeQuoteScene'
import { type Dispatch, type RootState } from '../../types/reduxTypes.js'
import { type GuiSwapInfo } from '../../types/types.js'

export const mapStateToProps = (state: RootState, ownProps: OwnProps): StateProps => {
  const { request } = ownProps.swapInfo

  const { account } = state.core
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
  shift(swapInfo: GuiSwapInfo) {
    dispatch(shiftCryptoCurrency(swapInfo))
  },
  timeExpired(swapInfo: GuiSwapInfo) {
    dispatch(exchangeTimerExpired(swapInfo))
  }
})

const CryptoExchangeQuoteConnector = connect(mapStateToProps, mapDispatchToProps)(CryptoExchangeQuoteScreenComponent)

export { CryptoExchangeQuoteConnector }
