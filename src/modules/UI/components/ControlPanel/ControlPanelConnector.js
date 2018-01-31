import {connect} from 'react-redux'

import ControlPanel from './ControlPanel.ui'
import {getUsername, getExchangeRate} from '../../../Core/selectors.js'
import {getSelectedWallet, getSelectedCurrencyCode, getExchangeDenomination} from '../../../UI/selectors.js'
import {getDisplayDenominationFull} from '../../Settings/selectors.js'
import {openSelectUser, closeSelectUser} from './action'

import {getUsersView} from './selectors.js'

const mapStateToProps = (state) => {
  let secondaryToPrimaryRatio = 0
  const guiWallet = getSelectedWallet(state)
  const currencyCode = getSelectedCurrencyCode(state)
  let primaryDisplayDenomination = null
  let primaryExchangeDenomination = null
  let secondaryDisplayAmount = '0'
  let secondaryDisplayCurrencyCode = ''

  if (guiWallet && currencyCode) {
    const isoFiatCurrencyCode = guiWallet.isoFiatCurrencyCode
    secondaryDisplayCurrencyCode = guiWallet.fiatCurrencyCode
    secondaryToPrimaryRatio = getExchangeRate(state, currencyCode, isoFiatCurrencyCode)
    primaryDisplayDenomination = getDisplayDenominationFull(state, currencyCode)
    primaryExchangeDenomination = getExchangeDenomination(state, currencyCode)
    secondaryDisplayAmount =
      parseFloat(1) *
      parseFloat(secondaryToPrimaryRatio) *
      parseFloat(primaryDisplayDenomination.multiplier) /
      parseFloat(primaryExchangeDenomination.multiplier)
  }

  return {
    currencyCode,
    primaryDisplayCurrencyCode: currencyCode,
    primaryDisplayDenomination,
    primaryExchangeDenomination,
    secondaryDisplayCurrencyCode,
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
