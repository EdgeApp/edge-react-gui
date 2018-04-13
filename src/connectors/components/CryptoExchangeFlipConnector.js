// @flow

//
// import {connect} from 'react-redux'
// import type {EdgeCurrencyWallet} from 'airbitz-core-types'
//
// import type {Dispatch, State} from '../../modules/ReduxTypes'
// import type { GuiDenomination, GuiCurrencyInfo } from '../../types'
// import {
//   CryptoExchangeFlipInputWrapperComponent,
//   type CryptoExchangeFlipInputWrapperComponentOwnProps,
//   type CryptoExchangeFlipInputWrapperComponentStateProps,
//   type CryptoExchangeFlipInputWrapperComponentDispatchProps
// } from '../../modules/UI/components/FlipInput/CryptoExchangeFlipInputWrapperComponent'
// import * as Constants from '../../constants/indexConstants'
// import * as UTILS from '../../modules/utils'
// import * as CORE_SELECTORS from '../../modules/Core/selectors'
// import * as actions from '../../actions/indexActions'
// import type {SetNativeAmountInfo} from '../../actions/CryptoExchangeActions'
//
// export const mapStateToProps = (state: State, ownProps: CryptoExchangeFlipInputWrapperComponentOwnProps): CryptoExchangeFlipInputWrapperComponentStateProps => {
//   // const fee = ownProps.fee ? ownProps.fee : null
//   let fiatPerCrypto = 0
//   const guiWallet = ownProps.guiWallet
//   const currencyCode = ownProps.currencyCode
//   // const whichWallet = ownProps.whichWallet
//   if (!guiWallet || !currencyCode) {
//     return {
//       // style: ownProps.style,
//       // whichWallet,
//       // fee,
//       currencyLogo: '',
//       fiatPerCrypto: 1,
//       nativeAmount: ''
//     }
//   }
//   const edgeWallet: EdgeCurrencyWallet = CORE_SELECTORS.getWallet(state, guiWallet.id)
//   const secondaryExchangeDenomination: GuiDenomination = UTILS.getDenomFromIsoCode(guiWallet.fiatCurrencyCode)
//   const secondaryDisplayDenomination: GuiDenomination = secondaryExchangeDenomination
//
//   const primaryInfo: GuiCurrencyInfo = ownProps.whichWallet === Constants.FROM ? state.cryptoExchange.fromWalletPrimaryInfo : state.cryptoExchange.toWalletPrimaryInfo
//   const secondaryInfo: GuiCurrencyInfo = {
//     displayCurrencyCode: guiWallet.fiatCurrencyCode,
//     exchangeCurrencyCode: guiWallet.isoFiatCurrencyCode,
//     displayDenomination: secondaryDisplayDenomination,
//     exchangeDenomination: secondaryExchangeDenomination
//   }
//   if (guiWallet) {
//     const isoFiatCurrencyCode = guiWallet.isoFiatCurrencyCode
//     fiatPerCrypto = CORE_SELECTORS.getExchangeRate(state, currencyCode, isoFiatCurrencyCode)
//   }
//
//   let nativeAmount, currencyLogo
//   if (ownProps.whichWallet === Constants.FROM) {
//     nativeAmount = state.cryptoExchange.toNativeAmount
//     currencyLogo = state.cryptoExchange.fromCurrencyIcon
//   } else {
//     nativeAmount = state.cryptoExchange.fromNativeAmount
//     currencyLogo = state.cryptoExchange.toCurrencyIcon
//   }
//   // const nativeAmount = ownProps.whichWallet === Constants.FROM ? state.cryptoExchange.fromNativeAmount : state.cryptoExchange.toNativeAmount
//   // const overridePrimaryExchangeAmount = bns.div(nativeAmount, )
//   // let currencyLogo = ownProps.whichWallet === Constants.FROM ? state.cryptoExchange.fromCurrencyIcon : state.cryptoExchange.toCurrencyIcon
//   currencyLogo = currencyLogo || ''
//   return {
//     edgeWallet,
//     currencyLogo,
//     primaryInfo,
//     secondaryInfo,
//     fiatPerCrypto,
//     nativeAmount
//   }
// }
//
// export const mapDispatchToProps = (dispatch: Dispatch): CryptoExchangeFlipInputWrapperComponentDispatchProps => ({
//   setNativeAmount: (data: SetNativeAmountInfo) => dispatch(actions.setNativeAmount(data))
// })
//
// export default connect(mapStateToProps, mapDispatchToProps)(CryptoExchangeFlipInputWrapperComponent)
