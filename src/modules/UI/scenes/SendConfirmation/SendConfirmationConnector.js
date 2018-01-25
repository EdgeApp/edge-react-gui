// @flow
import {connect} from 'react-redux'
import SendConfirmation, {type SendConfirmationStateProps, type SendConfirmationDispatchProps} from './SendConfirmation.ui'

import type {State, Dispatch} from '../../../ReduxTypes'
import type { GuiWallet, GuiDenomination, GuiCurrencyInfo } from '../../../../types'
import type {AbcCurrencyWallet, AbcTransaction, AbcParsedUri} from 'airbitz-core-types'

import {bns} from 'biggystring'

import * as CORE_SELECTORS from '../../../Core/selectors.js'
import * as UI_SELECTORS from '../../selectors.js'
import * as SETTINGS_SELECTORS from '../../Settings/selectors.js'

import { convertAbcToGuiDenomination, getDenomFromIsoCode } from '../../../utils.js'

import {
  signBroadcastAndSave,
  updateSpendPending,
  processParsedUri
} from './action.js'

const mapStateToProps = (state: State): SendConfirmationStateProps => {
  const sendConfirmation = UI_SELECTORS.getSceneState(state, 'sendConfirmation')
  let fiatPerCrypto = 0
  const currencyConverter = CORE_SELECTORS.getCurrencyConverter(state)
  const guiWallet: GuiWallet = UI_SELECTORS.getSelectedWallet(state)
  const abcWallet: AbcCurrencyWallet = CORE_SELECTORS.getWallet(state, guiWallet.id)
  const currencyCode = UI_SELECTORS.getSelectedCurrencyCode(state)

  // $FlowFixMe
  const primaryDisplayDenomination: GuiDenomination = convertAbcToGuiDenomination(SETTINGS_SELECTORS.getDisplayDenomination(state, currencyCode))
  // const primaryDisplayDenomination: GuiDenomination = SETTINGS_SELECTORS.getDisplayDenomination(state, currencyCode)
  const primaryExchangeDenomination: GuiDenomination = UI_SELECTORS.getExchangeDenomination(state, currencyCode)
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

  if (guiWallet) {
    const isoFiatCurrencyCode = guiWallet.isoFiatCurrencyCode
    fiatPerCrypto = CORE_SELECTORS.getExchangeRate(state, currencyCode, isoFiatCurrencyCode)
  }

  const {
    parsedUri,
    error,
    transaction,
    pending
  } = state.ui.scenes.sendConfirmation

  const nativeAmount = parsedUri.nativeAmount || '0'
  parsedUri.currencyCode = currencyCode

  let errorMsg = null
  if (error && parsedUri.nativeAmount && bns.gt(parsedUri.nativeAmount, '0')) {
    errorMsg = error.message
  }

  let sliderDisabled = true

  if (transaction && !error && !pending) {
    sliderDisabled = false
  }

  return {
    sendConfirmation,
    abcWallet,
    nativeAmount,
    errorMsg,
    fiatPerCrypto,
    guiWallet,
    currencyCode,
    primaryCurrencyInfo,
    sliderDisabled,
    secondaryCurrencyInfo,
    currencyConverter
  }
}

const mapDispatchToProps = (dispatch: Dispatch): SendConfirmationDispatchProps => ({
  processParsedUri: (parsedUri: AbcParsedUri): any => dispatch(processParsedUri(parsedUri)),
  updateSpendPending: (pending: number): any => dispatch(updateSpendPending(pending)),
  signBroadcastAndSave: (abcTransaction: AbcTransaction): any => dispatch(signBroadcastAndSave(abcTransaction))
})

export default connect(mapStateToProps, mapDispatchToProps)(SendConfirmation)
