import {connect} from 'react-redux'
import Request from './Request.ui'

import * as CORE_SELECTORS from '../../../Core/selectors.js'
import * as UI_SELECTORS from '../../selectors.js'
import * as SETTINGS_SELECTORS from '../../Settings/selectors.js'

import {saveReceiveAddress} from './action.js'

const mapStateToProps = (state) => {
  let secondaryToPrimaryRatio = 0
  const wallet = UI_SELECTORS.getSelectedWallet(state)
  const coreWallet = CORE_SELECTORS.getWallet(state, wallet.id)
  const currencyCode = UI_SELECTORS.getSelectedCurrencyCode(state)
  const primaryDisplayDenomination = SETTINGS_SELECTORS.getDisplayDenomination(state, currencyCode)
  const primaryExchangeDenomination = UI_SELECTORS.getExchangeDenomination(state, currencyCode)
  const secondaryExchangeDenomination = {
    name: 'Dollars',
    symbol: '$',
    multiplier: '100',
    precision: 2
  }
  const secondaryDisplayDenomination = secondaryExchangeDenomination
  const primaryInfo = {
    displayCurrencyCode: currencyCode,
    displayDenomination: primaryDisplayDenomination,
    exchangeDenomination: primaryExchangeDenomination
  }
  const secondaryInfo = {
    displayCurrencyCode: wallet.fiatCurrencyCode,
    displayDenomination: secondaryDisplayDenomination,
    exchangeDenomination: secondaryExchangeDenomination
  }
  if (wallet) {
    const isoFiatCurrencyCode = wallet.isoFiatCurrencyCode
    secondaryToPrimaryRatio = CORE_SELECTORS.getExchangeRate(state, currencyCode, isoFiatCurrencyCode)
  }

  return {
    request: state.ui.scenes.request,
    coreWallet,
    secondaryToPrimaryRatio,
    wallet,
    currencyCode,
    primaryInfo,
    secondaryInfo
  }
}
const mapDispatchToProps = (dispatch) => ({
  saveReceiveAddress: (receiveAddress) => dispatch(saveReceiveAddress(receiveAddress))
})

export default connect(mapStateToProps, mapDispatchToProps)(Request)
