//@flow
import type {GuiWallet, GuiDenomination, GuiCurrencyInfo} from '../../types'
import {connect} from 'react-redux'
import LinkedComponent
from '../../modules/UI/components/FlipInput/CryptoExchangeFlipInputWrapperComponent'
import * as UTILS from '../../modules/utils'
import * as CORE_SELECTORS from '../../modules/Core/selectors'
import * as UI_SELECTORS from '../../modules/UI/selectors'
import * as SETTINGS_SELECTORS from '../../modules/UI/Settings/selectors.js'
import type {AbcCurrencyWallet} from 'airbitz-core-types'
export const mapStateToProps = (state: any, ownProps: any) => {
  const fee = ownProps.fee ? ownProps.fee: null
  let fiatPerCrypto = 0
  const uiWallet: GuiWallet = ownProps.uiWallet
  const currencyCode = ownProps.currencyCode
  if (!uiWallet || !currencyCode) {
    return {
      style: ownProps.style,
      whichWallet: ownProps.whichWallet,
      fee
    }
  }
  const abcWallet: AbcCurrencyWallet = CORE_SELECTORS.getWallet(state, uiWallet.id)
  const primaryDisplayDenomination: GuiDenomination = SETTINGS_SELECTORS.getDisplayDenomination(state, currencyCode)
  const primaryExchangeDenomination: GuiDenomination = UI_SELECTORS.getExchangeDenomination(state, currencyCode, uiWallet)
  const secondaryExchangeDenomination: GuiDenomination = UTILS.getDenomFromIsoCode(uiWallet.fiatCurrencyCode)
  const secondaryDisplayDenomination: GuiDenomination = secondaryExchangeDenomination

  const primaryInfo: GuiCurrencyInfo = {
    displayCurrencyCode: currencyCode,
    exchangeCurrencyCode: currencyCode,
    displayDenomination: primaryDisplayDenomination,
    exchangeDenomination: primaryExchangeDenomination
  }
  const secondaryInfo: GuiCurrencyInfo = {
    displayCurrencyCode: uiWallet.fiatCurrencyCode,
    exchangeCurrencyCode: uiWallet.isoFiatCurrencyCode,
    displayDenomination: secondaryDisplayDenomination,
    exchangeDenomination: secondaryExchangeDenomination
  }
  if (uiWallet) {
    const isoFiatCurrencyCode = uiWallet.isoFiatCurrencyCode
    fiatPerCrypto = CORE_SELECTORS.getExchangeRate(state, currencyCode, isoFiatCurrencyCode)
  }

  /* const {
    parsedUri
  } = state.ui.scenes.sendConfirmation */
  const nativeAmount =  '100000000000000000' //..parsedUri.nativeAmount || '0'

  return {
    style: ownProps.style,
    whichWallet: ownProps.whichWallet,
    abcWallet,
    uiWallet,
    primaryInfo,
    secondaryInfo,
    fiatPerCrypto,
    nativeAmount,
    fee,
  }
}

export const mapDispatchToProps = (dispatch: any, ownProps: any) => ({
  launchWalletSelector: ownProps.launchWalletSelector
// nextScreen: () => dispatch(actions.nextScreen())
})

export default connect(mapStateToProps, mapDispatchToProps)(LinkedComponent)

