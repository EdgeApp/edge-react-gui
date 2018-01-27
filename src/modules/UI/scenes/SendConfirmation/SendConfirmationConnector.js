// @flow
import { connect } from 'react-redux'
import {SendConfirmation, type SendConfirmationStateProps, type SendConfirmationDispatchProps} from './SendConfirmation.ui'
import type { State, Dispatch } from '../../../ReduxTypes'
import type { GuiWallet, GuiDenomination, GuiCurrencyInfo } from '../../../../types'
import type { AbcTransaction, AbcMetadata } from 'airbitz-core-types'
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
  getNetworkFee
} from './selectors'
import {
  signBroadcastAndSave,
  updateSpendPending,
  updateAmount,
  reset
} from './action.js'
import {
  convertAbcToGuiDenomination,
  getDenomFromIsoCode
} from '../../../utils.js'

const mapStateToProps = (state: State): SendConfirmationStateProps => {
  let fiatPerCrypto = 0
  const guiWallet: GuiWallet = getSelectedWallet(state)
  const currencyCode = getSelectedCurrencyCode(state)

  if (guiWallet) {
    const isoFiatCurrencyCode = guiWallet.isoFiatCurrencyCode
    fiatPerCrypto = getExchangeRate(state, currencyCode, isoFiatCurrencyCode)
  }

  const transaction: AbcTransaction = getTransaction(state)
  const pending = getPending(state)
  const nativeAmount = getNativeAmount(state)
  const error = getError(state)

  let errorMsg = null
  if (error && nativeAmount && bns.gt(nativeAmount, '0')) {
    errorMsg = error.message
  }

  const primaryDisplayDenomination: GuiDenomination = convertAbcToGuiDenomination(getDisplayDenomination(state, currencyCode))
  const primaryExchangeDenomination: GuiDenomination = getExchangeDenomination(state, currencyCode)
  const secondaryExchangeDenomination: GuiDenomination = getDenomFromIsoCode(guiWallet.fiatCurrencyCode)
  const secondaryDisplayDenomination: GuiDenomination = secondaryExchangeDenomination
  const primaryExchangeCurrencyCode: string = primaryExchangeDenomination.name
  const secondaryExchangeCurrencyCode: string = secondaryExchangeDenomination.currencyCode ? secondaryExchangeDenomination.currencyCode : ''

  const primaryCurrencyInfo: GuiCurrencyInfo = {
    displayCurrencyCode: currencyCode,
    displayDenomination: primaryDisplayDenomination,
    exchangeCurrencyCode: primaryExchangeCurrencyCode,
    exchangeDenomination: primaryExchangeDenomination
  }
  const secondaryCurrencyInfo: GuiCurrencyInfo = {
    displayCurrencyCode: guiWallet.fiatCurrencyCode,
    displayDenomination: secondaryDisplayDenomination,
    exchangeCurrencyCode: secondaryExchangeCurrencyCode,
    exchangeDenomination: secondaryExchangeDenomination
  }

  return {
    nativeAmount,
    errorMsg,
    fiatPerCrypto,
    currencyCode,
    pending,
    publicAddress: getPublicAddress(state),
    keyboardIsVisible: getKeyboardIsVisible(state),
    label: getLabel(state),
    primaryCurrencyInfo,
    secondaryCurrencyInfo,
    networkFee: getNetworkFee(state),
    sliderDisabled: !transaction || !!error || !!pending,
    currencyConverter: getCurrencyConverter(state)
  }
}

const mapDispatchToProps = (dispatch: Dispatch): SendConfirmationDispatchProps => ({
  updateAmount: (nativeAmount: string, metadata: AbcMetadata) =>
    dispatch(updateAmount(nativeAmount, metadata)),
  reset: () => dispatch(reset()),
  updateSpendPending: (pending: boolean): any => dispatch(updateSpendPending(pending)),
  signBroadcastAndSave: (): any => dispatch(signBroadcastAndSave())
})

export default connect(mapStateToProps, mapDispatchToProps)(SendConfirmation)
