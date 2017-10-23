//@flow
import type {GuiWallet, GuiDenomination, GuiCurrencyInfo} from '../../types'
import {connect} from 'react-redux'
import LinkedComponent
from '../../modules/UI/components/FlipInput/CryptoExchangeFlipInputWrapperComponent'
import * as Constants from '../../constants/indexConstants'
import * as UTILS from '../../modules/utils'
import * as CORE_SELECTORS from '../../modules/Core/selectors'
import * as UI_SELECTORS from '../../modules/UI/selectors'
import * as SETTINGS_SELECTORS from '../../modules/UI/Settings/selectors.js'
import * as actions from '../../actions/indexActions'
import type {AbcCurrencyWallet} from 'airbitz-core-types'
export const mapStateToProps = (state: any, ownProps: any) => {
  const fee = ownProps.fee ? ownProps.fee: null
  let fiatPerCrypto = 0
  const uiWallet: GuiWallet = ownProps.uiWallet
  const currencyCode = ownProps.currencyCode
  const whichWallet = ownProps.whichWallet
  if (!uiWallet || !currencyCode) {
    return {
      style: ownProps.style,
      whichWallet,
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
  const nativeAmount =  ownProps.whichWallet === Constants.FROM ? state.cryptoExchange.fromNativeAmount : state.cryptoExchange.toNativeAmount

  return {
    style: ownProps.style,
    whichWallet,
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
  launchWalletSelector: ownProps.launchWalletSelector,
  //setNativeAmount: (data) => ownProps.changeNativeAmount(data)
  setNativeAmount: (data: {primaryNativeAmount: string, whichWallet: string}) => dispatch(actions.setNativeAmount(data))
})

export default connect(mapStateToProps, mapDispatchToProps)(LinkedComponent)

