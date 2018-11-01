// @flow

import { bns } from 'biggystring'
import { connect } from 'react-redux'

import type { SetNativeAmountInfo } from '../../actions/CryptoExchangeActions'
import { getQuoteForTransaction, getShapeShiftTokens, selectWalletForExchange } from '../../actions/CryptoExchangeActions.js'
import { CryptoExchangeScene } from '../../components/scenes/CryptoExchangeScene'
import type { CryptoExchangeSceneComponentDispatchProps, CryptoExchangeSceneComponentStateProps } from '../../components/scenes/CryptoExchangeScene'
import s from '../../locales/strings.js'
import type { Dispatch, State } from '../../modules/ReduxTypes'
import { getExchangeRate } from '../../modules/UI/selectors.js'
import { emptyCurrencyInfo, emptyGuiWallet } from '../../types.js'
import type { GuiCurrencyInfo } from '../../types.js'

const DIVIDE_PRECISION = 18

export const mapStateToProps = (state: State): CryptoExchangeSceneComponentStateProps => {
  const fromWallet = state.cryptoExchange.fromWallet
  const toWallet = state.cryptoExchange.toWallet

  let fromCurrencyCode, fromPrimaryInfo: GuiCurrencyInfo, fromButtonText: string, fromNativeAmount: string, fromExchangeAmount: string, fromFiatToCrypto: number
  if (fromWallet) {
    fromCurrencyCode = state.cryptoExchange.fromWalletPrimaryInfo.displayDenomination.name
    fromPrimaryInfo = state.cryptoExchange.fromWalletPrimaryInfo
    fromNativeAmount = state.cryptoExchange.fromNativeAmount
    fromButtonText = fromWallet.name + ':' + fromCurrencyCode
    fromExchangeAmount = bns.div(fromNativeAmount, fromPrimaryInfo.exchangeDenomination.multiplier, DIVIDE_PRECISION)
    fromFiatToCrypto = getExchangeRate(state, fromPrimaryInfo.exchangeCurrencyCode, fromWallet.isoFiatCurrencyCode)
  } else {
    fromCurrencyCode = ''
    fromExchangeAmount = ''
    fromPrimaryInfo = emptyCurrencyInfo
    fromButtonText = s.strings.select_src_wallet
    fromFiatToCrypto = 1
  }

  let toCurrencyCode, toPrimaryInfo: GuiCurrencyInfo, toButtonText: string, toNativeAmount: string, toExchangeAmount: string, toFiatToCrypto: number
  if (toWallet) {
    toCurrencyCode = state.cryptoExchange.toWalletPrimaryInfo.displayDenomination.name
    toPrimaryInfo = state.cryptoExchange.toWalletPrimaryInfo
    toNativeAmount = state.cryptoExchange.toNativeAmount
    toButtonText = toWallet.name + ':' + toCurrencyCode
    toExchangeAmount = bns.div(toNativeAmount, toPrimaryInfo.exchangeDenomination.multiplier, DIVIDE_PRECISION)
    toFiatToCrypto = getExchangeRate(state, toPrimaryInfo.exchangeCurrencyCode, toWallet.isoFiatCurrencyCode)
  } else {
    toCurrencyCode = ''
    toExchangeAmount = ''
    toPrimaryInfo = emptyCurrencyInfo
    toButtonText = s.strings.select_recv_wallet
    toFiatToCrypto = 1
  }
  const showKYCAlert = state.cryptoExchange.showKYCAlert
  return {
    fromWallet: fromWallet || emptyGuiWallet,
    fromExchangeAmount,
    fromCurrencyCode,
    fromPrimaryInfo,
    fromButtonText,
    fromFiatToCrypto,
    toWallet: toWallet || emptyGuiWallet,
    toExchangeAmount,
    toCurrencyCode,
    toPrimaryInfo,
    toButtonText,
    toFiatToCrypto,
    fromDisplayAmount: state.cryptoExchange.fromDisplayAmount,
    toDisplayAmount: state.cryptoExchange.toDisplayAmount,
    fromCurrencyIcon: state.cryptoExchange.fromCurrencyIcon || '',
    fromCurrencyIconDark: state.cryptoExchange.fromCurrencyIconDark || '',
    toCurrencyIcon: state.cryptoExchange.toCurrencyIcon || '',
    toCurrencyIconDark: state.cryptoExchange.toCurrencyIconDark || '',
    forceUpdateGuiCounter: state.cryptoExchange.forceUpdateGuiCounter,
    showWalletSelectModal: state.ui.scenes.walletListModal.walletListModalVisible,
    shiftPendingTransaction: state.cryptoExchange.shiftPendingTransaction,
    showKYCAlert
  }
}

export const mapDispatchToProps = (dispatch: Dispatch): CryptoExchangeSceneComponentDispatchProps => ({
  getQuoteForTransaction: (fromWalletNativeAmount: SetNativeAmountInfo) => {
    dispatch(getQuoteForTransaction(fromWalletNativeAmount))
  },
  getShapeShiftTokens: () => {
    dispatch(getShapeShiftTokens())
  },
  onSelectWallet: (walletId: string, currencyCode: string) => {
    dispatch(selectWalletForExchange(walletId, currencyCode))
  },
  openModal: (data: string) => dispatch({ type: 'OPEN_WALLET_SELECTOR_MODAL', data })
  /*   addKYCToken: (data: {
    accessToken: string,
    refreshToken: string
  }) =>  */
})

const CryptoExchangeSceneConnector = connect(
  mapStateToProps,
  mapDispatchToProps
)(CryptoExchangeScene)

export { CryptoExchangeSceneConnector }
