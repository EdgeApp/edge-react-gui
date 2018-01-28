// @flow
import { connect } from 'react-redux'
import SendConfirmation, {type StateProps, type DispatchProps} from './SendConfirmation.ui'
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
  getNetworkFee
} from './selectors'
import {
  signBroadcastAndSave,
  updateSpendPending,
  updateAmount,
  reset
} from './action.js'

const mapStateToProps = (state: State): StateProps => {
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

  return {
    nativeAmount,
    errorMsg,
    fiatPerCrypto,
    currencyCode,
    pending,
    publicAddress: getPublicAddress(state),
    keyboardIsVisible: getKeyboardIsVisible(state),
    label: getLabel(state),
    // $FlowFixMe
    primaryDisplayDenomination: getDisplayDenomination(state, currencyCode),
    primaryExchangeDenomination: getExchangeDenomination(state, currencyCode),
    secondaryDisplayCurrencyCode: guiWallet.fiatCurrencyCode,
    secondaryExchangeCurrencyCode: guiWallet.isoFiatCurrencyCode,
    networkFee: getNetworkFee(state),
    sliderDisabled: !transaction || !!error || !!pending,
    currencyConverter: getCurrencyConverter(state)
  }
}

const mapDispatchToProps = (dispatch: Dispatch): DispatchProps => ({
  updateAmount: (
    primaryDisplayAmount: string,
    secondaryDisplayAmount: string,
    primaryMultiplier: string,
    secondaryMultiplier: string
  ) =>
    dispatch(updateAmount(
      primaryDisplayAmount,
      secondaryDisplayAmount,
      primaryMultiplier,
      secondaryMultiplier
    )),
  reset: () => dispatch(reset()),
  updateSpendPending: (pending: boolean): any => dispatch(updateSpendPending(pending)),
  signBroadcastAndSave: (): any => dispatch(signBroadcastAndSave())
})

export default connect(mapStateToProps, mapDispatchToProps)(SendConfirmation)
