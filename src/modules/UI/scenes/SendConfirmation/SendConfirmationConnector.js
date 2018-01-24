// @flow
import {connect} from 'react-redux'
import SendConfirmation, {type Props, type DispatchProps} from './SendConfirmation.ui'

import type {State, Dispatch} from '../../../ReduxTypes'
import type {GuiWallet} from '../../../../types'
import type {AbcTransaction, AbcMetadata} from 'airbitz-core-types'
import type {AbcMakeSpendInfo} from './action'
import {bns} from 'biggystring'

import * as CORE_SELECTORS from '../../../Core/selectors.js'
import * as UI_SELECTORS from '../../selectors.js'
import * as SETTINGS_SELECTORS from '../../Settings/selectors.js'
import * as SEND_SELECTORS from './selectors'
import { resetFees } from '../ChangeMiningFee/action'

import {
  signBroadcastAndSave,
  updateSpendPending,
  makeSpend,
  updateNativeAmount,
  updateMetadata
} from './action.js'

const mapStateToProps = (state: State): Props => {
  let fiatPerCrypto = 0
  const guiWallet: GuiWallet = UI_SELECTORS.getSelectedWallet(state)
  const currencyCode = UI_SELECTORS.getSelectedCurrencyCode(state)

  if (guiWallet) {
    const isoFiatCurrencyCode = guiWallet.isoFiatCurrencyCode
    fiatPerCrypto = CORE_SELECTORS.getExchangeRate(state, currencyCode, isoFiatCurrencyCode)
  }

  const transaction: AbcTransaction = SEND_SELECTORS.getTransaction(state)
  const pending = SEND_SELECTORS.getPending(state)
  const nativeAmount: string = SEND_SELECTORS.getNativeAmount(state) || '0'
  const error = SEND_SELECTORS.getError(state)

  let errorMsg = null
  if (error && nativeAmount && bns.gt(nativeAmount, '0')) {
    errorMsg = error.message
  }
  let networkFee = '0'
  if (transaction && bns.gt(transaction.networkFee, '0')) {
    networkFee = transaction.networkFee
  }

  return {
    metadata: SEND_SELECTORS.getMetadata(state) || {},
    nativeAmount,
    publicAddress: SEND_SELECTORS.getPublicAddress(state) || '',
    pending,
    keyboardIsVisible: SEND_SELECTORS.getKeyboardIsVisible(state),
    label: SEND_SELECTORS.getLabel(state),
    primaryDisplayDenomination: SETTINGS_SELECTORS.getDisplayDenomination(state, currencyCode),
    primaryExchangeDenomination: UI_SELECTORS.getExchangeDenomination(state, currencyCode),
    secondaryDisplayCurrencyCode: guiWallet.fiatCurrencyCode,
    secondaryExchangeCurrencyCode: guiWallet.isoFiatCurrencyCode,
    networkFeeOption: SEND_SELECTORS.getNetworkFeeOption(state),
    customNetworkFee: SEND_SELECTORS.getCustomNetworkFee(state),
    networkFee,
    errorMsg,
    fiatPerCrypto,
    currencyCode,
    sliderDisabled: !transaction || !!error || !!pending,
    currencyConverter: CORE_SELECTORS.getCurrencyConverter(state)
  }
}

const mapDispatchToProps = (dispatch: Dispatch): DispatchProps => ({
  makeSpend: (options: AbcMakeSpendInfo): any => dispatch(makeSpend(options)),
  updateAmounts: (nativeAmount: string, metadata: AbcMetadata): any => {
    dispatch(updateNativeAmount(nativeAmount))
    dispatch(updateMetadata(metadata))
  },
  resetFees: (): any => dispatch(resetFees()),
  updateSpendPending: (pending: boolean): any => dispatch(updateSpendPending(pending)),
  signBroadcastAndSave: (): any => dispatch(signBroadcastAndSave())
})

export default connect(mapStateToProps, mapDispatchToProps)(SendConfirmation)
