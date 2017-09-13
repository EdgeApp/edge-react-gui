import {connect} from 'react-redux'
import ControlPanel from './ControlPanel.ui'
import * as CORE_SELECTORS from '../../../Core/selectors.js'
import * as UI_SELECTORS from '../../../UI/selectors.js'
import * as SETTINGS_SELECTORS from '../../Settings/selectors.js'

const mapStateToProps = (state) => {
  let secondaryToPrimaryRatio = 0
  const wallet = UI_SELECTORS.getSelectedWallet(state)
  const currencyCode = UI_SELECTORS.getSelectedCurrencyCode(state)
  let primaryDisplayDenomination = {}
  let primaryExchangeDenomination = {}
  let secondaryExchangeDenomination = {}
  let secondaryDisplayDenomination = {}
  let primaryInfo = {}
  let secondaryInfo = {}
  let secondaryDisplayAmount = '0'

  if (wallet && currencyCode) {
    const isoFiatCurrencyCode = wallet.isoFiatCurrencyCode
    secondaryToPrimaryRatio = CORE_SELECTORS.getExchangeRate(state, currencyCode, isoFiatCurrencyCode)
    primaryDisplayDenomination = SETTINGS_SELECTORS.getDisplayDenomination(state, currencyCode)
    primaryExchangeDenomination = UI_SELECTORS.getExchangeDenomination(state, currencyCode)
    secondaryExchangeDenomination = {
      name: 'Dollars',
      symbol: '$',
      multiplier: '100',
      precision: 2
    }
    secondaryDisplayDenomination = secondaryExchangeDenomination
    primaryInfo = {
      displayCurrencyCode: currencyCode,
      displayDenomination: primaryDisplayDenomination,
      exchangeDenomination: primaryExchangeDenomination
    }
    secondaryInfo = {
      displayCurrencyCode: wallet.fiatCurrencyCode,
      displayDenomination: secondaryDisplayDenomination,
      exchangeDenomination: secondaryExchangeDenomination
    }
    secondaryDisplayAmount
      = parseFloat(1)
      * parseFloat(secondaryToPrimaryRatio)
      * parseFloat(primaryInfo.displayDenomination.multiplier)
      / parseFloat(primaryInfo.exchangeDenomination.multiplier)
  }

  return {
    currencyCode,
    primaryInfo,
    secondaryInfo,
    secondaryDisplayAmount,
    secondaryToPrimaryRatio,
    usersView: state.ui.scenes.controlPanel.usersView,
    username: CORE_SELECTORS.getUsername(state)
  }
}

export default connect(mapStateToProps)(ControlPanel)
