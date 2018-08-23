// @flow

import type { EdgeCurrencyWallet } from 'edge-core-js'
import { connect } from 'react-redux'

import type { GuiCurrencyInfo, GuiDenomination, GuiWallet } from '../../../../types'
import * as CORE_SELECTORS from '../../../Core/selectors.js'
import type { Dispatch, State } from '../../../ReduxTypes'
import { getDenomFromIsoCode } from '../../../utils'
import * as UI_SELECTORS from '../../selectors.js'
import * as SETTINGS_SELECTORS from '../../Settings/selectors.js'
import { onSelectWallet, refreshReceiveAddressRequest } from '../../Wallets/action'
import { Request } from './Request.ui'
import type { RequestDispatchProps, RequestLoadingProps, RequestStateProps } from './Request.ui'

const mapStateToProps = (state: State): RequestStateProps | RequestLoadingProps => {
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
      receiveAddress: null,
      secondaryCurrencyInfo: null,
      showToWalletModal: null,
      useLegacyAddress: null,
      currentScene: state.ui.scenes.currentScene
    }
  }

  const edgeWallet: EdgeCurrencyWallet = CORE_SELECTORS.getWallet(state, guiWallet.id)
  // $FlowFixMe
  const primaryDisplayDenomination: GuiDenomination = SETTINGS_SELECTORS.getDisplayDenomination(state, currencyCode)
  const primaryExchangeDenomination: GuiDenomination = UI_SELECTORS.getExchangeDenomination(state, currencyCode)
  const secondaryExchangeDenomination: GuiDenomination = getDenomFromIsoCode(guiWallet.fiatCurrencyCode)
  const secondaryDisplayDenomination: GuiDenomination = secondaryExchangeDenomination
  const primaryExchangeCurrencyCode: string = primaryExchangeDenomination.name
  const secondaryExchangeCurrencyCode: string = secondaryExchangeDenomination.name ? secondaryExchangeDenomination.name : ''

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
  const exchangeSecondaryToPrimaryRatio = CORE_SELECTORS.getExchangeRate(state, currencyCode, isoFiatCurrencyCode)

  return {
    currencyCode,
    edgeWallet,
    exchangeSecondaryToPrimaryRatio,
    guiWallet,
    loading: false,
    primaryCurrencyInfo,
    receiveAddress: state.ui.scenes.request.receiveAddress,
    secondaryCurrencyInfo,
    showToWalletModal: state.ui.scenes.scan.scanToWalletListModalVisibility,
    useLegacyAddress: state.ui.scenes.requestType.useLegacyAddress,
    currentScene: state.ui.scenes.currentScene
  }
}
const mapDispatchToProps = (dispatch: Dispatch): RequestDispatchProps => ({
  refreshReceiveAddressRequest: (walletId: string) => {
    dispatch(refreshReceiveAddressRequest(walletId))
  },
  onSelectWallet: (walletId: string, currencyCode: string) => dispatch(selectWallet(walletId, currencyCode))
})

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Request)
