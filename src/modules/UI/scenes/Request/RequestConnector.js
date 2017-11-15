// @flow

import {connect} from 'react-redux'
import Request from './Request.ui'

import * as CORE_SELECTORS from '../../../Core/selectors.js'
import * as UI_SELECTORS from '../../selectors.js'
import * as SETTINGS_SELECTORS from '../../Settings/selectors.js'

import {saveReceiveAddress} from './action.js'
import {getDenomFromIsoCode} from '../../../utils'

import type {AbcCurrencyWallet} from 'airbitz-core-types'
import type {GuiDenomination, GuiWallet} from '../../../../types'
import type {Dispatch, State} from '../../../ReduxTypes'

const mapStateToProps = (state: State) => {
  let secondaryToPrimaryRatio: number = 0
  const guiWallet: GuiWallet = UI_SELECTORS.getSelectedWallet(state)
  const currencyCode: string = UI_SELECTORS.getSelectedCurrencyCode(state)
  if (!guiWallet || !currencyCode) {
    return {
      loading: true,
      request: {},
      abcWallet: {},
      secondaryToPrimaryRatio: 0,
      wallet: {},
      currencyCode: '',
      primaryInfo: {},
      secondaryInfo: {}
    }
  }

  const abcWallet: AbcCurrencyWallet = CORE_SELECTORS.getWallet(state, guiWallet.id)
  const primaryDisplayDenomination: GuiDenomination = SETTINGS_SELECTORS.getDisplayDenomination(state, currencyCode)
  const primaryExchangeDenomination: GuiDenomination = UI_SELECTORS.getExchangeDenomination(state, currencyCode)
  const secondaryExchangeDenomination: GuiDenomination = getDenomFromIsoCode(guiWallet.fiatCurrencyCode)
  const secondaryDisplayDenomination: GuiDenomination = secondaryExchangeDenomination
  const primaryInfo = {
    displayCurrencyCode: currencyCode,
    displayDenomination: primaryDisplayDenomination,
    exchangeDenomination: primaryExchangeDenomination
  }
  const secondaryInfo = {
    displayCurrencyCode: guiWallet.fiatCurrencyCode,
    displayDenomination: secondaryDisplayDenomination,
    exchangeDenomination: secondaryExchangeDenomination
  }
  if (guiWallet) {
    const isoFiatCurrencyCode: string = guiWallet.isoFiatCurrencyCode
    secondaryToPrimaryRatio = CORE_SELECTORS.getExchangeRate(state, currencyCode, isoFiatCurrencyCode)
  }

  return {
    loading: false,
    request: state.ui.scenes.request,
    abcWallet,
    secondaryToPrimaryRatio,
    wallet: guiWallet,
    currencyCode,
    primaryInfo,
    secondaryInfo,
    showToWalletModal: state.ui.scenes.scan.scanToWalletListModalVisibility
  }
}
const mapDispatchToProps = (dispatch: Dispatch) => ({
  saveReceiveAddress: (receiveAddress) => dispatch(saveReceiveAddress(receiveAddress))
})

export default connect(mapStateToProps, mapDispatchToProps)(Request)
