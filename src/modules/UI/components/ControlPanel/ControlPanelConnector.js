// @flow

import { connect } from 'react-redux'

import * as CORE_SELECTORS from '../../../Core/selectors.js'
import type { Dispatch, State } from '../../../ReduxTypes.js'
import * as UI_SELECTORS from '../../../UI/selectors.js'
import * as SETTINGS_SELECTORS from '../../Settings/selectors.js'
import { closeSelectUser, openSelectUser } from './action'
import ControlPanel from './ControlPanel.ui'

const mapStateToProps = (state: State) => {
  let secondaryToPrimaryRatio = 0
  const guiWallet = UI_SELECTORS.getSelectedWallet(state)
  const currencyCode = UI_SELECTORS.getSelectedCurrencyCode(state)
  let primaryDisplayDenomination = null
  let primaryExchangeDenomination = null
  let secondaryDisplayAmount = '0'
  let secondaryDisplayCurrencyCode = ''
  let currencyLogo = ''

  if (guiWallet && currencyCode) {
    const isoFiatCurrencyCode = guiWallet.isoFiatCurrencyCode
    currencyLogo = guiWallet.symbolImage
    secondaryDisplayCurrencyCode = guiWallet.fiatCurrencyCode
    secondaryToPrimaryRatio = CORE_SELECTORS.getExchangeRate(state, currencyCode, isoFiatCurrencyCode)
    primaryDisplayDenomination = SETTINGS_SELECTORS.getDisplayDenominationFull(state, currencyCode)
    primaryExchangeDenomination = UI_SELECTORS.getExchangeDenomination(state, currencyCode)
    secondaryDisplayAmount =
      (parseFloat(1) *
        parseFloat(secondaryToPrimaryRatio) *
        // $FlowFixMe
        parseFloat(primaryDisplayDenomination.multiplier)) /
      parseFloat(primaryExchangeDenomination.multiplier)
  }

  return {
    currencyCode,
    currencyLogo,
    primaryDisplayCurrencyCode: currencyCode,
    primaryDisplayDenomination,
    primaryExchangeDenomination,
    secondaryDisplayCurrencyCode,
    secondaryDisplayAmount,
    secondaryToPrimaryRatio,
    usersView: state.ui.scenes.controlPanel.usersView,
    username: CORE_SELECTORS.getUsername(state)
  }
}
const mapDispatchToProps = (dispatch: Dispatch) => ({
  openSelectUser: () => dispatch(openSelectUser()),
  closeSelectUser: () => dispatch(closeSelectUser())
})
export default connect(
  mapStateToProps,
  mapDispatchToProps
)(ControlPanel)
