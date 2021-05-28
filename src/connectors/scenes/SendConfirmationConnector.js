// @flow

import {
  type EdgeCurrencyInfo,
  type EdgeSpendInfo,
  type EdgeTransaction,
  asMaybeNoAmountSpecifiedError
} from 'edge-core-js'
import { connect } from 'react-redux'

import {
  type FioSenderInfo,
  getAuthRequiredDispatch,
  sendConfirmationUpdateTx,
  signBroadcastAndSave
} from '../../actions/SendConfirmationActions.js'
import { activated as uniqueIdentifierModalActivated } from '../../actions/UniqueIdentifierModalActions.js'
import type {
  SendConfirmationDispatchProps,
  SendConfirmationStateProps
} from '../../components/scenes/SendConfirmationScene'
import { SendConfirmation } from '../../components/scenes/SendConfirmationScene'
import {
  getDisplayDenomination,
  getExchangeDenomination as settingsGetExchangeDenomination,
  getPlugins
} from '../../modules/Settings/selectors.js'
import {
  getPublicAddress,
  getTransaction
} from '../../modules/UI/scenes/SendConfirmation/selectors'
import {
  getExchangeDenomination,
  getExchangeRate,
  getSelectedWallet
} from '../../modules/UI/selectors.js'
import { type GuiMakeSpendInfo } from '../../reducers/scenes/SendConfirmationReducer.js'
import { type Dispatch, type RootState } from '../../types/reduxTypes.js'
import { type SpendAuthType } from '../../types/types.js'
import { convertNativeToExchange, getCurrencyInfo } from '../../util/utils'

const mapStateToProps = (state: RootState): SendConfirmationStateProps => {
  const sceneState = state.ui.scenes.sendConfirmation
  let fiatPerCrypto = 0
  let secondaryExchangeCurrencyCode = ''

  const { currencyWallets } = state.core.account
  const guiWallet = getSelectedWallet(state)
  const coreWallet = currencyWallets[guiWallet.id]
  const currencyCode = state.ui.wallets.selectedCurrencyCode
  const balanceInCrypto = guiWallet.nativeBalances[currencyCode]

  const isoFiatCurrencyCode = guiWallet.isoFiatCurrencyCode
  const exchangeDenomination = settingsGetExchangeDenomination(
    state,
    currencyCode
  )
  const balanceInCryptoDisplay = convertNativeToExchange(
    exchangeDenomination.multiplier
  )(balanceInCrypto)
  fiatPerCrypto = getExchangeRate(state, currencyCode, isoFiatCurrencyCode)
  const balanceInFiat = fiatPerCrypto * parseFloat(balanceInCryptoDisplay)

  const plugins: Object = getPlugins(state)
  const allCurrencyInfos: EdgeCurrencyInfo[] = plugins.allCurrencyInfos
  const currencyInfo: EdgeCurrencyInfo | void = getCurrencyInfo(
    allCurrencyInfos,
    currencyCode
  )

  if (guiWallet) {
    const isoFiatCurrencyCode = guiWallet.isoFiatCurrencyCode
    secondaryExchangeCurrencyCode = isoFiatCurrencyCode
  }

  const transaction = getTransaction(state)
  const pending = sceneState.pending
  const nativeAmount = sceneState.nativeAmount
  let error = sceneState.error

  let errorMsg = null
  let resetSlider = false
  // consider refactoring this method for resetting slider
  if (
    error &&
    (error.message === 'broadcastError' ||
      error.message === 'transactionCancelled')
  ) {
    error = null
    resetSlider = true
  }
  errorMsg = error ? error.message : ''
  if (error && asMaybeNoAmountSpecifiedError(error.name) != null) errorMsg = ''
  const networkFee = transaction ? transaction.networkFee : null
  const parentNetworkFee =
    transaction && transaction.parentNetworkFee
      ? transaction.parentNetworkFee
      : null
  const uniqueIdentifier = sceneState.guiMakeSpendInfo.uniqueIdentifier
  const transactionMetadata = sceneState.transactionMetadata
  const exchangeRates = state.exchangeRates
  const { toggleCryptoOnTop } = sceneState

  const out = {
    balanceInCrypto,
    balanceInFiat,
    currencyCode,
    currencyInfo: currencyInfo || null,
    transactionMetadata,
    errorMsg,
    guiWallet,
    exchangeRates,
    fiatCurrencyCode: guiWallet.fiatCurrencyCode,
    fiatPerCrypto,
    forceUpdateGuiCounter: sceneState.forceUpdateGuiCounter,
    isEditable: sceneState.isEditable,
    nativeAmount,
    networkFee,
    parentDisplayDenomination: getDisplayDenomination(
      state,
      guiWallet.currencyCode
    ),
    parentExchangeDenomination: getExchangeDenomination(
      state,
      guiWallet.currencyCode
    ),
    parentNetworkFee,
    pending,
    primaryDisplayDenomination: getDisplayDenomination(state, currencyCode),
    primaryExchangeDenomination: getExchangeDenomination(state, currencyCode),
    publicAddress: getPublicAddress(state),
    resetSlider,
    secondaryExchangeCurrencyCode,
    sliderDisabled: !transaction || !!error || !!pending,
    uniqueIdentifier,
    authRequired: sceneState.authRequired,
    address: sceneState.address,
    sceneState,
    coreWallet,
    toggleCryptoOnTop
  }
  return out
}

const mapDispatchToProps = (
  dispatch: Dispatch
): SendConfirmationDispatchProps => ({
  sendConfirmationUpdateTx: guiMakeSpendInfo =>
    dispatch(sendConfirmationUpdateTx(guiMakeSpendInfo)),
  reset() {
    dispatch({ type: 'UI/SEND_CONFIRMATION/RESET' })
  },
  updateSpendPending(pending: boolean) {
    dispatch({
      type: 'UI/SEND_CONFIRMATION/UPDATE_SPEND_PENDING',
      data: { pending }
    })
  },
  signBroadcastAndSave: (fioSender?: FioSenderInfo): any =>
    dispatch(signBroadcastAndSave(fioSender)),
  onChangePin(pin: string) {
    dispatch({
      type: 'UI/SEND_CONFIRMATION/NEW_PIN',
      data: { pin }
    })
  },
  uniqueIdentifierButtonPressed: () => {
    dispatch(uniqueIdentifierModalActivated())
  },
  newSpendInfo(spendInfo: EdgeSpendInfo, isLimitExceeded: SpendAuthType) {
    dispatch({
      type: 'UI/SEND_CONFIRMATION/NEW_SPEND_INFO',
      data: { spendInfo, authRequired: isLimitExceeded }
    })
  },
  updateTransaction(
    transaction: EdgeTransaction | null,
    guiMakeSpendInfo: GuiMakeSpendInfo,
    forceUpdateGui: boolean,
    error: Error | null
  ) {
    dispatch({
      type: 'UI/SEND_CONFIRMATION/UPDATE_TRANSACTION',
      data: {
        error,
        forceUpdateGui,
        guiMakeSpendInfo,
        transaction
      }
    })
  },
  getAuthRequiredDispatch: (spendInfo: EdgeSpendInfo): any =>
    dispatch(getAuthRequiredDispatch(spendInfo)) // Type casting any cause dispatch returns a function
})

export default connect(mapStateToProps, mapDispatchToProps)(SendConfirmation)
