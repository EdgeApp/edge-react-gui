import {connect} from 'react-redux'

import ControlPanel from './ControlPanel.ui'
import {getUsername, getExchangeRate} from '../../../Core/selectors.js'
import {getSelectedWallet, getSelectedCurrencyCode, getExchangeDenomination} from '../../../UI/selectors.js'
import {getDisplayDenominationFull} from '../../Settings/selectors.js'
import {openSelectUser, closeSelectUser} from './action'
import {getDenomFromIsoCode} from '../../../utils'

import {getUsersView} from './selectors.js'

const mapStateToProps = (state) => {
  let secondaryToPrimaryRatio = 0
  const guiWallet = getSelectedWallet(state)
  const currencyCode = getSelectedCurrencyCode(state)
  let primaryDisplayDenomination = {}
  let primaryExchangeDenomination = {}
  let secondaryExchangeDenomination = {}
  let secondaryDisplayDenomination = {}
  let primaryInfo = {}
  let secondaryInfo = {}
  let secondaryDisplayAmount = '0'

  if (guiWallet && currencyCode) {
    const isoFiatCurrencyCode = guiWallet.isoFiatCurrencyCode
    secondaryToPrimaryRatio = getExchangeRate(state, currencyCode, isoFiatCurrencyCode)
    primaryDisplayDenomination = getDisplayDenominationFull(state, currencyCode)
    primaryExchangeDenomination = getExchangeDenomination(state, currencyCode)
    secondaryExchangeDenomination = getDenomFromIsoCode(guiWallet.fiatCurrencyCode)
    secondaryDisplayDenomination = secondaryExchangeDenomination
    primaryInfo = {
      displayCurrencyCode: currencyCode,
      displayDenomination: primaryDisplayDenomination,
      exchangeDenomination: primaryExchangeDenomination
    }
    secondaryInfo = {
      displayCurrencyCode: guiWallet.fiatCurrencyCode,
      displayDenomination: secondaryDisplayDenomination,
      exchangeDenomination: secondaryExchangeDenomination
    }
    secondaryDisplayAmount =
      parseFloat(1) *
      parseFloat(secondaryToPrimaryRatio) *
      parseFloat(primaryInfo.displayDenomination.multiplier) /
      parseFloat(primaryInfo.exchangeDenomination.multiplier)
  }

  return {
    currencyCode,
    primaryInfo,
    secondaryInfo,
    secondaryDisplayAmount,
    secondaryToPrimaryRatio,
    usersView: getUsersView(state),
    username: getUsername(state)
  }
}
const mapDispatchToProps = (dispatch) => ({
  openSelectUser: () => dispatch(openSelectUser()),
  closeSelectUser: () => dispatch(closeSelectUser())
})
export default connect(mapStateToProps, mapDispatchToProps)(ControlPanel)
