import {connect} from 'react-redux'
import Request from './Request.ui'

import * as CORE_SELECTORS from '../../../Core/selectors.js'
import * as UI_SELECTORS from '../../selectors.js'
import * as SETTINGS_SELECTORS from '../../Settings/selectors.js'

import {saveReceiveAddress} from './action.js'
import {getDenomFromIsoCode} from '../../../utils'

const mapStateToProps = (state) => {
  let secondaryToPrimaryRatio = 0
  const guiWallet = UI_SELECTORS.getSelectedWallet(state)
  if (!guiWallet) {
    return {
      loading: true,
      request: {},
      abcWallet: {},
      secondaryToPrimaryRatio: '',
      wallet: {},
      currencyCode: '',
      primaryInfo: {},
      secondaryInfo: {}
    }
  }

  const abcWallet = CORE_SELECTORS.getWallet(state, guiWallet.id)
  const currencyCode = UI_SELECTORS.getSelectedCurrencyCode(state)
  const primaryDisplayDenomination = SETTINGS_SELECTORS.getDisplayDenomination(state, currencyCode)
  const primaryExchangeDenomination = UI_SELECTORS.getExchangeDenomination(state, currencyCode)
  const secondaryExchangeDenomination: GuiDenomination = getDenomFromIsoCode(guiWallet.fiatCurrencyCode)
  const secondaryDisplayDenomination = secondaryExchangeDenomination
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
    const isoFiatCurrencyCode = guiWallet.isoFiatCurrencyCode
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
    secondaryInfo
  }
}
const mapDispatchToProps = (dispatch) => ({
  saveReceiveAddress: (receiveAddress) => dispatch(saveReceiveAddress(receiveAddress))
})

export default connect(mapStateToProps, mapDispatchToProps)(Request)
