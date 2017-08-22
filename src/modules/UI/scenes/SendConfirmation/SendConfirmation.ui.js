import React, { Component } from 'react'
import PropTypes from 'prop-types'
import {
  View,
  ScrollView,
  ActivityIndicator
} from 'react-native'
import { connect } from 'react-redux'
import styles from './styles.js'
import ExchangeRate from '../../components/ExchangeRate/index.js'
import ExchangedFlipInput from '../../components/FlipInput/ExchangedFlipInput.js'
import Recipient from '../../components/Recipient/index.js'
import ABSlider from '../../components/Slider/index.js'
import LinearGradient from 'react-native-linear-gradient'

import * as CORE_SELECTORS from '../../../Core/selectors.js'
import * as UI_SELECTORS from '../../selectors.js'
import * as SETTINGS_SELECTORS from '../../Settings/selectors.js'
import * as UTILS from '../../../utils.js'

import {
  updateCryptoAmountRequest,
  signBroadcastAndSave,

  updateAmountSatoshiRequest,
  updateMaxSatoshiRequest,
  useMaxSatoshi,
  updateSpendPending,

  processURI
} from './action.js'

class SendConfirmation extends Component {
  constructor (props) {
    super(props)
    this.state = {
      primaryNativeAmount: props.transaction.nativeAmount,
      secondaryNativeAmount: '',
      keyboardVisible: false
    }
  }
  _onFocus = () => this.setState({ keyboardVisible: true })
  _onBlur = () => this.setState({ keyboardVisible: false })

  componentDidMount () {
    this.props.processURI(this.props.sendConfirmation.parsedURI)
  }

  onAmountsChange = ({ primaryDisplayAmount, secondaryDisplayAmount }) => {
    const primaryNativeToDenominationRatio = this.props.primaryInfo.displayDenomination.multiplier.toString()
    const secondaryNativeToDenominationRatio = this.props.secondaryInfo.displayDenomination.multiplier.toString()

    const primaryNativeAmount = UTILS.convertDisplayToNative(primaryNativeToDenominationRatio)(primaryDisplayAmount)
    const secondaryNativeAmount = UTILS.convertDisplayToNative(secondaryNativeToDenominationRatio)(secondaryDisplayAmount)

    const secondaryExchangeAmount = this.convertSecondaryDisplayToSecondaryExchange(secondaryDisplayAmount)

    const parsedURI = this.props.sendConfirmation.parsedURI
    parsedURI.metadata = {
      amountFiat: secondaryExchangeAmount
    }
    parsedURI.nativeAmount = primaryNativeAmount

    this.props.processURI(parsedURI)

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
      fiatPerCrypto
    } = this.props
    const nativeAmount = this.props.transaction.nativeAmount
    console.log('nativeAmount', nativeAmount)
    const color = 'white'

    console.log('rendering SendConfirmation.ui.js->render, this.props is: ', this.props)
    return (
      <LinearGradient
        style={[styles.view]}
        start={{x: 0, y: 0}} end={{x: 1, y: 0}}
        colors={['#3b7adb', '#2b569a']}>
        <ScrollView style={[styles.mainScrollView]} keyboardShouldPersistTaps={'always'}>

          <View style={[styles.exchangeRateContainer, UTILS.border()]}>
            <ExchangeRate
              fiatPerCrypto={this.props.fiatPerCrypto}
              primaryInfo={this.props.primaryInfo}
              secondaryInfo={this.props.secondaryInfo} />
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
            {this.props.sendConfirmation.pending &&
              <ActivityIndicator style={[{ flex: 1, alignSelf: 'center' }, UTILS.border()]} size={'small'} />
            }
          </View>
          <ABSlider style={[UTILS.border()]} onSlidingComplete={this.signBroadcastAndSave} sliderDisabled={false} />
        </ScrollView>
      </LinearGradient>
    )
  }

  signBroadcastAndSave = () => {
    const { transaction } = this.props
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
  const wallet = UI_SELECTORS.getSelectedWallet(state)
  const coreWallet = CORE_SELECTORS.getWallet(state, wallet.id)
  const currencyCode = UI_SELECTORS.getSelectedCurrencyCode(state)
  const primaryDisplayDenomination = SETTINGS_SELECTORS.getDisplayDenomination(state, currencyCode)
  const primaryExchangeDenomination = UI_SELECTORS.getExchangeDenomination(state, currencyCode)
  const secondaryExchangeDenomination = {
    name: 'Dollars',
    symbol: '$',
    multiplier: '100',
    precision: 2
  }
  const secondaryDisplayDenomination = secondaryExchangeDenomination
  const primaryInfo = {
    displayCurrencyCode: currencyCode,
    exchangeCurrencyCode: currencyCode,
    displayDenomination: primaryDisplayDenomination,
    exchangeDenomination: primaryExchangeDenomination
  }
  const secondaryInfo = {
    displayCurrencyCode: wallet.fiatCurrencyCode,
    exchangeCurrencyCode: wallet.isoFiatCurrencyCode,
    displayDenomination: secondaryDisplayDenomination,
    exchangeDenomination: secondaryExchangeDenomination
  }
  if (wallet) {
    const isoFiatCurrencyCode = wallet.isoFiatCurrencyCode
    fiatPerCrypto = CORE_SELECTORS.getExchangeRate(state, currencyCode, isoFiatCurrencyCode)
  }

  return {
    sendConfirmation: state.ui.scenes.sendConfirmation,
    transaction: state.ui.scenes.sendConfirmation.transaction,
    coreWallet,
    fiatPerCrypto,
    wallet,
    currencyCode,
    primaryInfo,
    secondaryInfo
  }
}
const mapDispatchToProps = (dispatch) => ({
  processURI: (parsedURI) => dispatch(processURI(parsedURI)),
  updateCryptoAmount: cryptoAmount => dispatch(updateCryptoAmountRequest(cryptoAmount)),
  updateAmountSatoshi: cryptoAmount => dispatch(updateAmountSatoshiRequest(cryptoAmount)),
  signBroadcastAndSave: transaction => dispatch(signBroadcastAndSave(transaction)),
  updateMaxSatoshi: () => dispatch(updateMaxSatoshiRequest()),
  useMaxSatoshi: () => dispatch(useMaxSatoshi())
})
export default connect(mapStateToProps, mapDispatchToProps)(SendConfirmation)
