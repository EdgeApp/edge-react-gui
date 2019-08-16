// @flow

import { bns } from 'biggystring'
import { connect } from 'react-redux'

import type { SetNativeAmountInfo } from '../../actions/CryptoExchangeActions'
import { getQuoteForTransaction, selectWalletForExchange } from '../../actions/CryptoExchangeActions.js'
import { createCurrencyWalletAndAddToSwap } from '../../actions/indexActions'
import { CryptoExchangeScene } from '../../components/scenes/CryptoExchangeScene'
import type { CryptoExchangeSceneComponentDispatchProps, CryptoExchangeSceneComponentStateProps } from '../../components/scenes/CryptoExchangeScene'
import { DEFAULT_STARTER_WALLET_NAMES } from '../../constants/indexConstants'
import s from '../../locales/strings.js'
import * as SETTINGS_SELECTORS from '../../modules/Settings/selectors.js'
import { getExchangeRate } from '../../modules/UI/selectors.js'
import type { Dispatch, State } from '../../types/reduxTypes.js'
import { type GuiCurrencyInfo, emptyCurrencyInfo, emptyGuiWallet } from '../../types/types.js'

const DIVIDE_PRECISION = 18

export const mapStateToProps = (state: State): CryptoExchangeSceneComponentStateProps => {
  const fromWallet = state.cryptoExchange.fromWallet
  const toWallet = state.cryptoExchange.toWallet
  const supportedWalletTypes = SETTINGS_SELECTORS.getSupportedWalletTypes(state)
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
  const wallets = state.ui.wallets.byId
  const totalWallets = Object.keys(wallets).length
  const creatingWallet = state.cryptoExchange.creatingWallet
  const settings = SETTINGS_SELECTORS.getSettings(state)
  const defaultIsoFiat = settings.defaultIsoFiat
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
    // showWalletSelectModal: state.ui.scenes.walletListModal.walletListModalVisible,
    shiftPendingTransaction: state.cryptoExchange.shiftPendingTransaction,
    calculatingMax: state.cryptoExchange.calculatingMax,
    showKYCAlert,
    pluginCompleteKYC: state.cryptoExchange.pluginCompleteKYC,
    wallets,
    totalWallets,
    supportedWalletTypes,
    state,
    creatingWallet,
    defaultIsoFiat
  }
}

export const mapDispatchToProps = (dispatch: Dispatch): CryptoExchangeSceneComponentDispatchProps => ({
  getQuoteForTransaction: (fromWalletNativeAmount: SetNativeAmountInfo) => {
    dispatch(getQuoteForTransaction(fromWalletNativeAmount))
  },
  onSelectWallet: (walletId: string, currencyCode: string) => {
    dispatch(selectWalletForExchange(walletId, currencyCode))
  },
  openModal: (data: 'from' | 'to') => dispatch({ type: 'OPEN_WALLET_SELECTOR_MODAL', data }),
  wipeKYCFlag: () => dispatch({ type: 'WIPE_KYC_NEED' }),
  createCurrencyWallet: (walletType: string, currencyCode: string, fiat: string) => {
    const walletName = DEFAULT_STARTER_WALLET_NAMES[currencyCode]
    dispatch(createCurrencyWalletAndAddToSwap(walletName, walletType, fiat))
  }
})

const CryptoExchangeSceneConnector = connect(
  mapStateToProps,
  mapDispatchToProps
)(CryptoExchangeScene)

export { CryptoExchangeSceneConnector }
