// @flow

import { connect } from 'react-redux'

import { type Dispatch, type RootState } from '../../../../types/reduxTypes.js'
import { getCurrencyIcon } from '../../../../util/CurrencyInfoHelpers.js'
import { getDisplayDenominationFull } from '../../../Settings/selectors.js'
import { getExchangeRate, getPrimaryExchangeDenomination, getSelectedWallet } from '../../../UI/selectors.js'
import ControlPanel from './ControlPanel.ui'

const mapStateToProps = (state: RootState) => {
  let secondaryToPrimaryRatio = 0
  const guiWallet = getSelectedWallet(state)
  const currencyCode = state.ui.wallets.selectedCurrencyCode
  const exchangeRate = guiWallet ? getExchangeRate(state, currencyCode, guiWallet.isoFiatCurrencyCode) : 0
  let primaryDisplayDenomination = null
  let primaryExchangeDenomination = null
  let secondaryDisplayAmount = '0'
  let secondaryDisplayCurrencyCode = ''
  let currencyLogo = ''

  // Try catch block to check specific details why the guiWallet.metaTokens becomes undefined
  try {
    if (guiWallet && currencyCode) {
      const isoFiatCurrencyCode = guiWallet.isoFiatCurrencyCode
      // if selected currencyCode is parent wallet currencyCode
      currencyLogo = getCurrencyIcon(guiWallet.currencyCode, currencyCode).symbolImage
      secondaryDisplayCurrencyCode = guiWallet.fiatCurrencyCode
      secondaryToPrimaryRatio = getExchangeRate(state, currencyCode, isoFiatCurrencyCode)
      primaryDisplayDenomination = getDisplayDenominationFull(state, currencyCode)
      primaryExchangeDenomination = getPrimaryExchangeDenomination(state, currencyCode)
      secondaryDisplayAmount =
        (parseFloat(1) * parseFloat(secondaryToPrimaryRatio) * parseFloat(primaryDisplayDenomination.multiplier)) /
        parseFloat(primaryExchangeDenomination.multiplier)
    }
  } catch (error) {
    console.log('ControlPanelGuiWalletId', guiWallet.id)
    console.log('ControlPanelGuiWalletCurrencyCode', guiWallet.currencyCode)
    console.log('ControlPanelGuiWalletNativeBalances', guiWallet.nativeBalances)
    console.log('ControlPanelGuiWalletMetaTokens', guiWallet.metaTokens)
    console.log('ControlPanelGuiWalletEnabledTokens', guiWallet.enabledTokens)
    throw new Error(error)
  }

  return {
    currencyCode,
    currencyLogo,
    primaryDisplayCurrencyCode: currencyCode,
    primaryDisplayDenomination,
    primaryExchangeDenomination,
    exchangeRate,
    secondaryDisplayCurrencyCode,
    secondaryDisplayAmount,
    secondaryToPrimaryRatio,
    usersView: state.ui.scenes.controlPanel.usersView,
    username: state.core.account.username
  }
}
const mapDispatchToProps = (dispatch: Dispatch) => ({
  openSelectUser: () => dispatch({ type: 'OPEN_SELECT_USER' }),
  closeSelectUser: () => dispatch({ type: 'CLOSE_SELECT_USER' })
})
export default connect(mapStateToProps, mapDispatchToProps)(ControlPanel)
