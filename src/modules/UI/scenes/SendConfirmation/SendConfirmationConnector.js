// @flow
import {connect} from 'react-redux'
import SendConfirmation, {type Props, type DispatchProps} from './SendConfirmation.ui'

import type {State, Dispatch} from '../../../ReduxTypes'
import type {GuiWallet, GuiCurrencyInfo, GuiDenomination} from '../../../../types'
import type {AbcCurrencyWallet, AbcTransaction, AbcParsedUri} from 'airbitz-core-types'

import {bns} from 'biggystring'

import * as UTILS from '../../../utils'
import * as CORE_SELECTORS from '../../../Core/selectors.js'
import * as UI_SELECTORS from '../../selectors.js'
import * as SETTINGS_SELECTORS from '../../Settings/selectors.js'

import {
  signBroadcastAndSave,
  updateSpendPending,
  processParsedUri
} from './action.js'


const mapStateToProps = (state: State): Props => {
  const sendConfirmation = UI_SELECTORS.getSceneState(state, 'sendConfirmation')
  let fiatPerCrypto = 0
  const guiWallet: GuiWallet = UI_SELECTORS.getSelectedWallet(state)
  const abcWallet: AbcCurrencyWallet = CORE_SELECTORS.getWallet(state, guiWallet.id)
  const currencyCode = UI_SELECTORS.getSelectedCurrencyCode(state)
  const primaryDisplayDenomination: GuiDenomination = SETTINGS_SELECTORS.getDisplayDenomination(state, currencyCode)
  const primaryExchangeDenomination: GuiDenomination = UI_SELECTORS.getExchangeDenomination(state, currencyCode)
  const secondaryExchangeDenomination: GuiDenomination = UTILS.getDenomFromIsoCode(guiWallet.fiatCurrencyCode)
  const secondaryDisplayDenomination: GuiDenomination = secondaryExchangeDenomination
  const primaryInfo: GuiCurrencyInfo = {
    displayCurrencyCode: currencyCode,
    exchangeCurrencyCode: currencyCode,
    displayDenomination: primaryDisplayDenomination,
    exchangeDenomination: primaryExchangeDenomination
  }
  const secondaryInfo: GuiCurrencyInfo = {
    displayCurrencyCode: guiWallet.fiatCurrencyCode,
    exchangeCurrencyCode: guiWallet.isoFiatCurrencyCode,
    displayDenomination: secondaryDisplayDenomination,
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
    primaryInfo,
    sliderDisabled,
    secondaryInfo
  }
}

const mapDispatchToProps = (dispatch: Dispatch): DispatchProps => ({
  processParsedUri: (parsedUri: AbcParsedUri): any => dispatch(processParsedUri(parsedUri)),
  updateSpendPending: (pending: boolean): any => dispatch(updateSpendPending(pending)),
  signBroadcastAndSave: (abcTransaction: AbcTransaction): any => dispatch(signBroadcastAndSave(abcTransaction))
})

export default connect(mapStateToProps, mapDispatchToProps)(SendConfirmation)
