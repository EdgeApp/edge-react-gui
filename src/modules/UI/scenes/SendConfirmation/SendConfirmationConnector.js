// @flow
import {connect} from 'react-redux'
import SendConfirmation from './SendConfirmation.ui'
import {bns} from 'biggystring'

import {getDenomFromIsoCode} from '../../../utils'
import * as CORE_SELECTORS from '../../../Core/selectors.js'
import * as UI_SELECTORS from '../../selectors.js'
import * as SETTINGS_SELECTORS from '../../Settings/selectors.js'
import type {GuiWallet, GuiCurrencyInfo, GuiDenomination} from '../../../../types'
import type {AbcCurrencyWallet} from 'airbitz-core-types'

import {
  signBroadcastAndSave,
  updateSpendPending,
  processParsedUri
} from './action.js'

const mapStateToProps = (state) => {
  let fiatPerCrypto = 0
  const guiWallet: GuiWallet = UI_SELECTORS.getSelectedWallet(state)
  const abcWallet: AbcCurrencyWallet = CORE_SELECTORS.getWallet(state, guiWallet.id)
  const currencyCode = UI_SELECTORS.getSelectedCurrencyCode(state)
  const primaryDisplayDenomination: GuiDenomination = SETTINGS_SELECTORS.getDisplayDenomination(state, currencyCode)
  const primaryExchangeDenomination: GuiDenomination = UI_SELECTORS.getExchangeDenomination(state, currencyCode)
  const secondaryExchangeDenomination: GuiDenomination = getDenomFromIsoCode(guiWallet.fiatCurrencyCode)
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

  const nativeAmount = state.ui.scenes.sendConfirmation.parsedUri.nativeAmount
    ? state.ui.scenes.sendConfirmation.parsedUri.nativeAmount : '0'

  let errorMsg = null
  if (state.ui.scenes.sendConfirmation.error) {
    if (state.ui.scenes.sendConfirmation.parsedUri.nativeAmount) {
      if (bns.gt(state.ui.scenes.sendConfirmation.parsedUri.nativeAmount, '0')) {
        errorMsg = state.ui.scenes.sendConfirmation.error.message
      }
    }
  }

  let sliderDisabled = true

  if (state.ui.scenes.sendConfirmation.transaction && !state.ui.scenes.sendConfirmation.error) {
    sliderDisabled = false
  }

  return {
    sendConfirmation: state.ui.scenes.sendConfirmation,
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

const mapDispatchToProps = (dispatch) => ({
  processParsedUri: (parsedUri) => dispatch(processParsedUri(parsedUri)),
  updateSpendPending: (pendind) => dispatch(updateSpendPending(pendind)),
  signBroadcastAndSave: (transaction) => dispatch(signBroadcastAndSave(transaction))
})

export default connect(mapStateToProps, mapDispatchToProps)(SendConfirmation)
