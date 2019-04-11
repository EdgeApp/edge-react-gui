// @flow

import { connect } from 'react-redux'

import { getUsername } from '../../../Core/selectors.js'
import type { Dispatch, State } from '../../../ReduxTypes.js'
import { getDisplayDenominationFull } from '../../../Settings/selectors.js'
import { getExchangeDenomination, getExchangeRate, getSelectedCurrencyCode, getSelectedWallet } from '../../../UI/selectors.js'
import ControlPanel from './ControlPanel.ui'

const mapStateToProps = (state: State) => {
  let secondaryToPrimaryRatio = 0
  const guiWallet = getSelectedWallet(state)
  const currencyCode = getSelectedCurrencyCode(state)
  let primaryDisplayDenomination = null
  let primaryExchangeDenomination = null
  let secondaryDisplayAmount = '0'
  let secondaryDisplayCurrencyCode = ''
  let currencyLogo = ''

  if (guiWallet && currencyCode) {
    const isoFiatCurrencyCode = guiWallet.isoFiatCurrencyCode
    // if selected currencyCode is parent wallet currencyCode
    if (guiWallet.currencyCode === currencyCode) {
      currencyLogo = guiWallet.symbolImage
    } else {
      // otherwise it is likely a token, so find the metaToken object and get symbolImage
      const metaToken = guiWallet.metaTokens.find(metaToken => currencyCode === metaToken.currencyCode)
      if (metaToken && metaToken.symbolImage) {
        currencyLogo = metaToken.symbolImage
      } else {
        currencyLogo = guiWallet.symbolImage
      }
    }
    secondaryDisplayCurrencyCode = guiWallet.fiatCurrencyCode
    secondaryToPrimaryRatio = getExchangeRate(state, currencyCode, isoFiatCurrencyCode)
    primaryDisplayDenomination = getDisplayDenominationFull(state, currencyCode)
    primaryExchangeDenomination = getExchangeDenomination(state, currencyCode)
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
    username: getUsername(state)
  }
}
const mapDispatchToProps = (dispatch: Dispatch) => ({
  openSelectUser: () => dispatch({ type: 'OPEN_SELECT_USER' }),
  closeSelectUser: () => dispatch({ type: 'CLOSE_SELECT_USER' })
})
export default connect(
  mapStateToProps,
  mapDispatchToProps
)(ControlPanel)
