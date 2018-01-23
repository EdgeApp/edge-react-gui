// @flow
import {connect} from 'react-redux'
import SendConfirmation, {type Props, type DispatchProps} from './SendConfirmation.ui'
import type {FlipInputFieldInfo} from '../../components/FlipInput/FlipInput.ui'

import type {State, Dispatch} from '../../../ReduxTypes'
import type {GuiWallet, GuiDenomination} from '../../../../types'
import type {AbcCurrencyWallet, AbcTransaction, AbcParsedUri} from 'airbitz-core-types'

import {bns} from 'biggystring'

import * as CORE_SELECTORS from '../../../Core/selectors.js'
import * as UI_SELECTORS from '../../selectors.js'
import * as SETTINGS_SELECTORS from '../../Settings/selectors.js'
import * as SEND_SELECTORS from './selectors'
import { resetFees } from '../ChangeMiningFee/action'

import {
  signBroadcastAndSave,
  updateSpendPending,
  updateTransactionAmount
} from './action.js'

const mapStateToProps = (state: State): Props => {
  let fiatPerCrypto = 0
  const currencyConverter = CORE_SELECTORS.getCurrencyConverter(state)
  const guiWallet: GuiWallet = UI_SELECTORS.getSelectedWallet(state)
  const abcWallet: AbcCurrencyWallet = CORE_SELECTORS.getWallet(state, guiWallet.id)
  const currencyCode = UI_SELECTORS.getSelectedCurrencyCode(state)
  const primaryDisplayDenomination: GuiDenomination = SETTINGS_SELECTORS.getDisplayDenomination(state, currencyCode)
  const primaryExchangeDenomination: GuiDenomination = UI_SELECTORS.getExchangeDenomination(state, currencyCode)

  if (guiWallet) {
    const isoFiatCurrencyCode = guiWallet.isoFiatCurrencyCode
    fiatPerCrypto = CORE_SELECTORS.getExchangeRate(state, currencyCode, isoFiatCurrencyCode)
  }

  const transaction = SEND_SELECTORS.getTransaction(state)
  const pending = SEND_SELECTORS.getPending(state)
  const parsedUri = SEND_SELECTORS.getParsedUri(state)
  const keyboardIsVisible = SEND_SELECTORS.getKeyboardIsVisible(state)
  const error = SEND_SELECTORS.getError(state)

  const nativeAmount = parsedUri.nativeAmount || '0'
  parsedUri.currencyCode = currencyCode

  let errorMsg = null
  if (error && parsedUri.nativeAmount && bns.gt(parsedUri.nativeAmount, '0')) {
    errorMsg = error.message
  }
  let networkFee = '0'
  if (transaction && bns.gt(transaction.networkFee, '0')) {
    networkFee = transaction.networkFee
  }

  return {
    pending,
    keyboardIsVisible,
    label: SEND_SELECTORS.getLabel(state),
    publicAddress: SEND_SELECTORS.getPublicAddress(state),
    primaryDisplayCurrencyCode: currencyCode,
    primaryExchangeCurrencyCode: currencyCode,
    primaryDisplayDenomination,
    primaryExchangeDenomination,
    secondaryDisplayCurrencyCode: guiWallet.fiatCurrencyCode,
    secondaryExchangeCurrencyCode: guiWallet.isoFiatCurrencyCode,
    networkFeeOption: SEND_SELECTORS.getNetworkFeeOption(state),
    networkFee,
    nativeAmount,
    errorMsg,
    fiatPerCrypto,
    currencyCode,
    sliderDisabled: !transaction || error || pending,
    currencyConverter
  }
}

const mapDispatchToProps = (dispatch: Dispatch): DispatchProps => ({
  processParsedUri: (parsedUri: AbcParsedUri): any => dispatch(processParsedUri(parsedUri)),
  updateSpendPending: (pending: boolean): any => dispatch(updateSpendPending(pending)),
  signBroadcastAndSave: (abcTransaction: AbcTransaction): any => dispatch(signBroadcastAndSave(abcTransaction))
})

export default connect(mapStateToProps, mapDispatchToProps)(SendConfirmation)
