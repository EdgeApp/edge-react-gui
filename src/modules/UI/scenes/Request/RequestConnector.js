// @flow

import type { EdgeCurrencyWallet } from 'edge-core-js'
import { connect } from 'react-redux'

import type { GuiCurrencyInfo, GuiDenomination, GuiReceiveAddress, GuiWallet } from '../../../../types'
import * as CORE_SELECTORS from '../../../Core/selectors.js'
import type { Dispatch, State } from '../../../ReduxTypes'
import { getDenomFromIsoCode } from '../../../utils'
import * as UI_SELECTORS from '../../selectors.js'
import * as SETTINGS_SELECTORS from '../../Settings/selectors.js'
import { saveReceiveAddress } from './action.js'
import { Request } from './Request.ui'
import type { RequestDispatchProps, RequestStateProps, RequestLoadingProps } from './Request.ui'

const mapStateToProps = (state: State): RequestStateProps | RequestLoadingProps => {
  let exchangeSecondaryToPrimaryRatio: number = 0
  const guiWallet: GuiWallet = UI_SELECTORS.getSelectedWallet(state)
  const currencyCode: string = UI_SELECTORS.getSelectedCurrencyCode(state)
  if (!guiWallet || !currencyCode) {
    return {
      currencyCode: null,
      edgeWallet: null,
      exchangeSecondaryToPrimaryRatio: null,
      guiWallet: null,
      loading: true,
      primaryCurrencyInfo: null,
      request: {},
      secondaryCurrencyInfo: null,
      showToWalletModal: null,
      useLegacyAddress: null
    }
  }

  const edgeWallet: EdgeCurrencyWallet = CORE_SELECTORS.getWallet(state, guiWallet.id)
  // $FlowFixMe
  const primaryDisplayDenomination: GuiDenomination = SETTINGS_SELECTORS.getDisplayDenomination(state, currencyCode)
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
  const isoFiatCurrencyCode: string = guiWallet.isoFiatCurrencyCode
  exchangeSecondaryToPrimaryRatio = CORE_SELECTORS.getExchangeRate(state, currencyCode, isoFiatCurrencyCode)

  return {
    currencyCode,
    edgeWallet,
    exchangeSecondaryToPrimaryRatio,
    guiWallet,
    loading: false,
    primaryCurrencyInfo,
    request: state.ui.scenes.request,
    secondaryCurrencyInfo,
    showToWalletModal: state.ui.scenes.scan.scanToWalletListModalVisibility,
    useLegacyAddress: state.ui.scenes.requestType.useLegacyAddress
  }
}
const mapDispatchToProps = (dispatch: Dispatch): RequestDispatchProps => ({
  saveReceiveAddress: (receiveAddress: GuiReceiveAddress) => {
    dispatch(saveReceiveAddress(receiveAddress))
  }
})

export default connect(mapStateToProps, mapDispatchToProps)(Request)
