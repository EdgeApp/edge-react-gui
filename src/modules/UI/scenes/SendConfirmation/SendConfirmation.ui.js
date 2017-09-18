// @flow

import React, {Component} from 'react'
import PropTypes from 'prop-types'
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator
} from 'react-native'
import {connect} from 'react-redux'
import {bns} from 'biggystring'
import styles from './styles.js'
import ExchangeRate from '../../components/ExchangeRate/index.js'
import ExchangedFlipInput from '../../components/FlipInput/ExchangedFlipInput.js'
import Recipient from '../../components/Recipient/index.js'
import ABSlider from '../../components/Slider/index.js'

// $FlowFixMe
import LinearGradient from 'react-native-linear-gradient'

import * as CORE_SELECTORS from '../../../Core/selectors.js'
import * as UI_SELECTORS from '../../selectors.js'
import * as SETTINGS_SELECTORS from '../../Settings/selectors.js'
import * as UTILS from '../../../utils.js'
import type {GuiWallet, GuiCurrencyInfo, GuiDenomination} from '../../../../types'
import type {AbcCurrencyWallet, AbcParsedUri} from 'airbitz-core-types'
import type {SendConfirmationState} from './reducer'

import {
  signBroadcastAndSave,
  // updateAmountSatoshiRequest,
  // updateMaxSatoshiRequest,
  // useMaxSatoshi,
  updateSpendPending,
  processParsedUri
} from './action.js'

type Props = {
  sendConfirmation: SendConfirmationState,
  abcWallet: AbcCurrencyWallet,
  nativeAmount: string,
  errorMsg: string | null,
  fiatPerCrypto: number,
  wallet: GuiWallet,
  currencyCode: string,
  primaryInfo: GuiCurrencyInfo,
  sliderDisabled: boolean,
  secondaryInfo: GuiCurrencyInfo,
  processUri(AbcParsedUri): void
}

// type SCState = {
//   primaryNativeAmount: string,
//   secondaryNativeAmount: string,
//   keyboardVisible: boolean
// }

class SendConfirmation extends Component<any, any, any> {
  state: {
    primaryNativeAmount: string,
    secondaryNativeAmount: string,
    keyboardVisible: boolean
  }

  constructor (props: Props) {
    super(props)
    const amt = props.sendConfirmation.transaction ? props.sendConfirmation.transaction.nativeAmount : '0'
    this.state = {
      primaryNativeAmount: amt,
      secondaryNativeAmount: '',
      keyboardVisible: false
    }
  }
  _onFocus = () => this.setState({keyboardVisible: true})
  _onBlur = () => this.setState({keyboardVisible: false})

  componentDidMount () {
    this.props.processParsedUri(this.props.sendConfirmation.parsedUri)
  }

  onAmountsChange = ({primaryDisplayAmount, secondaryDisplayAmount}) => {
    const primaryNativeToDenominationRatio = this.props.primaryInfo.displayDenomination.multiplier.toString()
    const secondaryNativeToDenominationRatio = this.props.secondaryInfo.displayDenomination.multiplier.toString()

    const primaryNativeAmount = UTILS.convertDisplayToNative(primaryNativeToDenominationRatio)(primaryDisplayAmount)
    const secondaryNativeAmount = UTILS.convertDisplayToNative(secondaryNativeToDenominationRatio)(secondaryDisplayAmount)

    const secondaryExchangeAmount = this.convertSecondaryDisplayToSecondaryExchange(secondaryDisplayAmount)

    const parsedUri = this.props.sendConfirmation.parsedUri
    parsedUri.metadata = {
      amountFiat: secondaryExchangeAmount
    }
    parsedUri.nativeAmount = primaryNativeAmount

    this.props.processParsedUri(parsedUri)

    this.setState({
      primaryNativeAmount,
      secondaryNativeAmount
    })
  }

  render () {
    const {
      label,
      publicAddress
     } = this.props.sendConfirmation
    const {
      primaryInfo,
      secondaryInfo,
      fiatPerCrypto,
      errorMsg,
      nativeAmount
    } = this.props
    // console.log('nativeAmount', nativeAmount)
    const color = 'white'

    // console.log('rendering SendConfirmation.ui.js->render, this.props is: ', this.props)
    return (
      <LinearGradient
        style={[styles.view]}
        start={{x: 0, y: 0}} end={{x: 1, y: 0}}
        colors={['#3b7adb', '#2b569a']}>
        <ScrollView style={[styles.mainScrollView]} keyboardShouldPersistTaps={'always'}>

          <View style={[styles.exchangeRateContainer, UTILS.border()]}>
            {
              errorMsg
                ? <Text style={[styles.error]}>
                  {errorMsg}
                </Text>
                :                <ExchangeRate
                  secondaryDisplayAmount={this.props.fiatPerCrypto}
                  primaryInfo={this.props.primaryInfo}
                  secondaryInfo={this.props.secondaryInfo} />
            }
          </View>

          <View style={[styles.main, UTILS.border(), {flex: this.state.keyboardVisible ? 0 : 1}]}>
            <ExchangedFlipInput
              primaryInfo={{...primaryInfo, nativeAmount}}
              secondaryInfo={secondaryInfo}
              secondaryToPrimaryRatio={fiatPerCrypto}
              onAmountsChange={this.onAmountsChange}
              color={color} />
            {/* <ExchangedFees networkFee={networkFee} providerFee={providerFee} /> */}
            <Recipient label={label} link={''} publicAddress={publicAddress} />
            {/* <Password /> */}
          </View>
          <View style={[styles.pendingSymbolArea]}>
            {this.props.sendConfirmation.pending
              && <ActivityIndicator style={[{flex: 1, alignSelf: 'center'}, UTILS.border()]} size={'small'} />
            }
          </View>
          <ABSlider style={[UTILS.border()]} onSlidingComplete={this.signBroadcastAndSave} sliderDisabled={this.props.sliderDisabled} />
        </ScrollView>
      </LinearGradient>
    )
  }

  signBroadcastAndSave = () => {
    const {transaction} = this.props
    this.props.dispatch(updateSpendPending(true))
    this.props.signBroadcastAndSave(transaction)
  }

  getTopSpacer = () => {
    if (this.props.sendConfirmation.keyboardIsVisible) {
      return
    } else {
      return <View style={styles.spacer} />
    }
  }

  getBottomSpacer = () => {
    if (!this.props.sendConfirmation.keyboardIsVisible) {
      return
    } else {
      return <View style={styles.spacer} />
    }
  }

  onMaxPress = () => {
    this.props.useMaxSatoshi()
  }

  convertSecondaryDisplayToSecondaryExchange = (secondaryDisplayAmount: string): string => {
    const secondaryDisplayToExchangeRatio = this.getSecondaryDisplayToExchangeRatio()
    return (UTILS.convertDisplayToExchange(secondaryDisplayToExchangeRatio)(secondaryDisplayAmount)).toString()
  }
  getSecondaryDisplayToExchangeRatio = (): string => {
    const displayMultiplier = this.props.secondaryInfo.displayDenomination.multiplier.toString()
    const exchangeMultiplier = this.props.secondaryInfo.exchangeDenomination.multiplier.toString()
    return (UTILS.deriveDisplayToExchangeRatio(exchangeMultiplier)(displayMultiplier)).toString()
  }
}

SendConfirmation.propTypes = {
  sendConfirmation: PropTypes.object,
  fiatPerCrypto: PropTypes.number,
  inpurCurrencyDenom: PropTypes.string,
  fiatCurrencyCode: PropTypes.string
}

const mapStateToProps = (state) => {
  let fiatPerCrypto = 0
  const guiWallet: GuiWallet = UI_SELECTORS.getSelectedWallet(state)
  const abcWallet: AbcCurrencyWallet = CORE_SELECTORS.getWallet(state, guiWallet.id)
  const currencyCode = UI_SELECTORS.getSelectedCurrencyCode(state)
  const primaryDisplayDenomination: GuiDenomination = SETTINGS_SELECTORS.getDisplayDenomination(state, currencyCode)
  const primaryExchangeDenomination: GuiDenomination = UI_SELECTORS.getExchangeDenomination(state, currencyCode)
  // TODO: Replace this with an ISO currency code lookup table -paulvp
  const secondaryExchangeDenomination: GuiDenomination = {
    name: 'Dollars',
    symbol: '$',
    multiplier: '100',
    precision: 2
  }
  const secondaryDisplayDenomination: GuiDenomination = secondaryExchangeDenomination
  const primaryInfo: GuiCurrencyInfo = {
    displayCurrencyCode: currencyCode,
    exchangeCurrencyCode: currencyCode,
    displayDenomination: primaryDisplayDenomination,
    exchangeDenomination: primaryExchangeDenomination
  }
  const secondaryInfo: GuiCurrencyInfo = {
    displayCurrencyCode: guiWallet.fiatCurrencyCode,
    exchangeCurrencyCode: guiWallet.isoFiatCurrencyCode,
    displayDenomination: secondaryDisplayDenomination,
    exchangeDenomination: secondaryExchangeDenomination
  }
  if (guiWallet) {
    const isoFiatCurrencyCode = guiWallet.isoFiatCurrencyCode
    fiatPerCrypto = CORE_SELECTORS.getExchangeRate(state, currencyCode, isoFiatCurrencyCode)
  }

  const nativeAmount = state.ui.scenes.sendConfirmation.parsedUri.nativeAmount
    ? state.ui.scenes.sendConfirmation.parsedUri.nativeAmount : '0'
  let errorMsg = null
  if (state.ui.scenes.sendConfirmation.error) {
    if (state.ui.scenes.sendConfirmation.parsedUri.nativeAmount) {
      if (bns.gt(state.ui.scenes.sendConfirmation.parsedUri.nativeAmount, '0')) {
        errorMsg = state.ui.scenes.sendConfirmation.error.message
      }
    }
  }

  let sliderDisabled = true

  if (state.ui.scenes.sendConfirmation.transaction && !state.ui.scenes.sendConfirmation.error) {
    sliderDisabled = false
  }

  return {
    sendConfirmation: state.ui.scenes.sendConfirmation,
    abcWallet,
    nativeAmount,
    errorMsg,
    fiatPerCrypto,
    guiWallet,
    currencyCode,
    primaryInfo,
    sliderDisabled,
    secondaryInfo
  }
}
const mapDispatchToProps = (dispatch) => ({
  processParsedUri: (parsedUri) => dispatch(processParsedUri(parsedUri)),
  // updateAmountSatoshi: (cryptoAmount) => dispatch(updateAmountSatoshiRequest(cryptoAmount)),
  signBroadcastAndSave: (transaction) => dispatch(signBroadcastAndSave(transaction)),
  // updateMaxSatoshi: () => dispatch(updateMaxSatoshiRequest()),
  // useMaxSatoshi: () => dispatch(useMaxSatoshi())
})
export default connect(mapStateToProps, mapDispatchToProps)(SendConfirmation)
