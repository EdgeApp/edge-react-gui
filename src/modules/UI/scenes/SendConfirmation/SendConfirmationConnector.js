// @flow
import { connect } from 'react-redux'
import {SendConfirmation, type SendConfirmationStateProps, type SendConfirmationDispatchProps} from './SendConfirmation.ui'
import type { State, Dispatch } from '../../../ReduxTypes'
import type { GuiWallet } from '../../../../types'
import type { AbcTransaction } from 'edge-login'
import { bns } from 'biggystring'
import { getExchangeRate, getCurrencyConverter } from '../../../Core/selectors.js'
import { getDisplayDenomination } from '../../Settings/selectors.js'
import {
  getSelectedWallet,
  getSelectedCurrencyCode,
  getExchangeDenomination
} from '../../selectors.js'
import {
  getTransaction,
  getPending,
  getNativeAmount,
  getError,
  getPublicAddress,
  getKeyboardIsVisible,
  getLabel,
  getForceUpdateGuiCounter,
  getNetworkFee
} from './selectors'
import {
  signBroadcastAndSave,
  updateSpendPending,
  updateAmount,
  reset
} from './action.js'

const mapStateToProps = (state: State): SendConfirmationStateProps => {
  let fiatPerCrypto = 0
  let secondaryeExchangeCurrencyCode = ''
  const guiWallet: GuiWallet = getSelectedWallet(state)
  const currencyCode = getSelectedCurrencyCode(state)

  if (guiWallet) {
    const isoFiatCurrencyCode = guiWallet.isoFiatCurrencyCode
    fiatPerCrypto = getExchangeRate(state, currencyCode, isoFiatCurrencyCode)
    secondaryeExchangeCurrencyCode = isoFiatCurrencyCode
  }

  const transaction: AbcTransaction = getTransaction(state)
  const pending = getPending(state)
  const nativeAmount = getNativeAmount(state)
  const error = getError(state)

  let errorMsg = null
  if (error && nativeAmount && bns.gt(nativeAmount, '0')) {
    errorMsg = error.message
  }

  const out: SendConfirmationStateProps = {
    nativeAmount,
    errorMsg,
    fiatPerCrypto,
    currencyCode,
    pending,
    secondaryeExchangeCurrencyCode,
    fiatCurrencyCode: guiWallet.fiatCurrencyCode,
    primaryDisplayDenomination: getDisplayDenomination(state, currencyCode),
    primaryExchangeDenomination: getExchangeDenomination(state, currencyCode),
    forceUpdateGuiCounter: getForceUpdateGuiCounter(state),
    publicAddress: getPublicAddress(state),
    keyboardIsVisible: getKeyboardIsVisible(state),
    label: getLabel(state),
    networkFee: getNetworkFee(state),
    sliderDisabled: !transaction || !!error || !!pending,
    currencyConverter: getCurrencyConverter(state)
  }
  return out
}

const mapDispatchToProps = (dispatch: Dispatch): SendConfirmationDispatchProps => ({
  updateAmount: (nativeAmount: string, exchangeAmount: string, fiatPerCrypto: string) =>
    dispatch(updateAmount(nativeAmount, exchangeAmount, fiatPerCrypto)),
  reset: () => dispatch(reset()),
  updateSpendPending: (pending: boolean): any => dispatch(updateSpendPending(pending)),
  signBroadcastAndSave: (): any => dispatch(signBroadcastAndSave())
})

export default connect(mapStateToProps, mapDispatchToProps)(SendConfirmation)
