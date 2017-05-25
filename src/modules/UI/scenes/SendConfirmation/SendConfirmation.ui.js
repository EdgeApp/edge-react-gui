import React, { Component } from 'react'
import {
  View,
  Share,
  Text,
  TouchableHighlight,
  Keyboard,
  Button,
  Platform,
} from 'react-native'
import { connect } from 'react-redux'
import styles from './styles.js'
import ExchangeRate from '../../components/ExchangeRate/index.js'
import MaxButton from '../../components/MaxButton/index.js'
import FlipInput from '../../components/FlipInput/index.js'

import ABQRCode from '../../components/QRCode/index.js'
import RequestStatus from '../../components/RequestStatus/index.js'
import ShareButtons from '../../components/ShareButtons/index.js'

import Recipient from '../../components/Recipient/index.js'
import PinInput from '../../components/PinInput/index.js'
import ABSlider from '../../components/Slider/index.js'
import Fees from '../../components/Fees/index.js'

import { getCryptoFromFiat, getFiatFromCrypto, sanitizeInput } from '../../../utils.js'
import LinearGradient from 'react-native-linear-gradient'

import {
  setAmountRequestedInCrypto,
  setAmountRequestedInFiat,
  setAmountReceivedInCrypto,
  setFiatPerCrypto,
  setInputCurrencySelected,
  setLabel,
  setMaxAvailableToSpendInCrypto,
  setIsPinEnabled,
  setIsSliderEnabled,
  setDraftStatus,
  setIsKeyboardVisible,
  makeSignBroadcastAndSave,
} from './action.js'

class SendConfirmation extends Component {
  constructor (props) {
    super(props)

    const {
      isKeyboardVisible,
      isPinEnabled,
      uri,
      amountRequestedInCrypto,
      amountRequestedInFiat,
      amountReceivedInCrypto,
      fiatPerCrypto,
      inputCurrencySelected,
      publicAddress,
      label,
      maxAvailableToSpendInCrypto,
      draftStatus,
      isSliderEnabled,
    } = props.sendConfirmation

    this.state = {
      isKeyboardVisible,
      isPinEnabled,
      uri,
      amountRequestedInCrypto,
      amountRequestedInFiat,
      amountReceivedInCrypto,
      fiatPerCrypto,
      inputCurrencySelected,
      publicAddress,
      label,
      maxAvailableToSpendInCrypto,
      draftStatus,
      isSliderEnabled,
      pin: 1234,
    }
  }

  componentWillMount () {
    const events =
      (Platform.OS === 'ios') ?
      { keyboardShows: 'keyboardWillShow',
        keyboardHides: 'keyboardWillHide' } :
      { keyboardShows: 'keyboardDidShow',
        keyboardHides: 'keyboardDidHide' }

    this.keyboardShowsListener = Keyboard.addListener(events.keyboardShows,
      this._keyboardShows
    )
    this.keyboardHidesListener = Keyboard.addListener(events.keyboardHides,
      this._keyboardHides
    )
  }

  componentWillUnmount () {
    this.keyboardShowsListener.remove()
    this.keyboardHidesListener.remove()
  }

  _keyboardShows = () => {
    this.props.dispatch(setIsKeyboardVisible(true))
  }

  _keyboardHides = () => {
    this.props.dispatch(setIsKeyboardVisible(false))
  }

  getPinInputIfEnabled = () => {
    let pinInputIfEnabled

    if (this.state.isPinEnabled) {
      pinInputIfEnabled = (
        <View style={{flex: 1}}>
          <PinInput onPinChange={this.onPinChange} />
        </View>
      )
    }

    return pinInputIfEnabled
  }

  getFeeInFiat = () => {
    return '0.51'
  }

  getFeeInCrypto = () => {
    return '0.001'
  }

  render () {
    const {
      amountRequestedInCrypto,
      amountRequestedInFiat,
      amountReceivedInCrypto,
      publicAddress,
      draftStatus,
      fiatPerCrypto,
      inputCurrencySelected,
      label,
      isKeyboardVisible,
      isPinEnabled,
      isSliderEnabled,
      maxAvailableToSpendInCrypto,
    } = this.state

    console.log('this.state', this.state)
    console.log('this.props', this.props)


    return (
      <LinearGradient
        style={styles.view}
        start={{x:0,y:0}} end={{x:1, y:0}}
        colors={["#3b7adb","#2b569a"]}>

        <View style={styles.exchangeRateAndMax} >
          <View style={{flex: 1}}></View>

          <View style={{flex: 3}}>
            <ExchangeRate
              mode={draftStatus}
              style={{flex: 1}}
              fiatPerCrypto={fiatPerCrypto || 1077.75} />
          </View>

          <View style={{flex: 1}}>
            <MaxButton style={{flex: 1}}
              mode={draftStatus}
              onMaxPress={this.onMaxPress}/>
          </View>

        </View>

        <View style={styles.flipInput}>
          <FlipInput
            mode={draftStatus}
            onInputCurrencyToggle={this.onInputCurrencyToggle}
            onCryptoInputChange={this.onCryptoInputChange}
            onFiatInputChange={this.onFiatInputChange}
            amountRequestedInCrypto={amountRequestedInCrypto}
            amountRequestedInFiat={amountRequestedInFiat}
            inputCurrencySelected={inputCurrencySelected}
            maxAvailableToSpendInCrypto={maxAvailableToSpendInCrypto}
            displayFees
            feeInCrypto={this.getFeeInCrypto()}
            feeInFiat={this.getFeeInFiat()} />
        </View>

        <View style={styles.recipient}>
          <View style={{flex: 3}}>
            <Recipient label={label} address={publicAddress} />
          </View>

          {this.getPinInputIfEnabled()}
        </View>

        {this.getTopSpacer()}

        <View style={styles.slider}>
          <ABSlider
            style={{
              flex: 1,
            }}
            onSlidingComplete={this.signBroadcastAndSave}
            sliderDisabled={!isSliderEnabled} />
        </View>

        {this.getBottomSpacer()}

      </LinearGradient>
    )
  }

  signBroadcastAndSave = () => {
    console.log('this.props', this.props)
    const spendInfo = {
      spendTargets: [
        { publicAddress: this.state.uri, amount: this.props.amountRequestedInCrypto }
      ],
      networkFeeOption: 'standard',
      metadata: {}
    }

    this.props.dispatch(makeSignBroadcastAndSave(spendInfo))
  }

  getTopSpacer = () => {
    if (this.state.keyboardIsVisible) {
      return
    } else {
      return <View style={styles.spacer} />
    }
  }

  getBottomSpacer = () => {
    if (!this.state.keyboardIsVisible) {
      return
    } else {
      return <View style={styles.spacer} />
    }
  }

  isPinCorrect = (pin) => {
    const isCorrectPin = (this.state.pin === pin)
    console.log('Correct PIN')

    return isCorrectPin
  }

  onPinChange = (pin) => {
    console.log('pin: ' + pin)
    if (pin.length >= 4) {
      Keyboard.dismiss()

      if (this.isPinCorrect(parseInt(pin))) {
        console.log("Slider Enabled")
        this.setState({
          isSliderEnabled: true
        })
        this.props.dispatch(setIsSliderEnabled(true))
      }
    }
  }

  onMaxPress = () => {
    const amountRequestedInCrypto = this.getMaxAvailableToSpendInCrypto()
    const maxAvailableToSpendInCrypto = this.getMaxAvailableToSpendInCrypto()
    const { fiatPerCrypto = 1077.75} = this.state
    const amountRequestedInFiat = getFiatFromCrypto(amountRequestedInCrypto, fiatPerCrypto)
    const draftStatus = this.getDraftStatus(amountRequestedInCrypto, maxAvailableToSpendInCrypto)

    this.props.dispatch(setAmountReceivedInCrypto(amountRequestedInCrypto))
    this.props.dispatch(setAmountRequestedInFiat(amountRequestedInFiat))
    this.props.dispatch(setDraftStatus(draftStatus))
  }

  getDraftStatus = (amountRequestedInCrypto, maxAvailableToSpendInCrypto) => {
    let draftStatus

    if ( amountRequestedInCrypto > maxAvailableToSpendInCrypto ) {
      draftStatus = 'over'
    } else if ( amountRequestedInCrypto == maxAvailableToSpendInCrypto ) {
      draftStatus = 'max'
    } else {
      draftStatus = 'under'
    }

    return draftStatus
  }

  onInputCurrencyToggle = () => {
    console.log("toggle currency")
    const inputCurrencySelected =
      inputCurrencySelected === 'crypto'
        ? 'fiat'
        : 'crypto'

      this.props.dispatch(setInputCurrencySelected(inputCurrencySelected))
  }

  onCryptoInputChange = (amountRequestedInCrypto) => {
    amountRequestedInCrypto = sanitizeInput(amountRequestedInCrypto)
    if (this.invalidInput(amountRequestedInCrypto)) { return }

    const amountRequestedInFiat = getFiatFromCrypto(amountRequestedInCrypto, fiatPerCrypto)
    const maxAvailableToSpendInCrypto = this.getMaxAvailableToSpendInCrypto()
    const draftStatus = this.getDraftStatus(amountRequestedInCrypto, maxAvailableToSpendInCrypto)

    this.props.dispatch(setAmountReceivedInCrypto(amountRequestedInCrypto))
    this.props.dispatch(setAmountRequestedInFiat(amountRequestedInFiat))
    this.props.dispatch(setDraftStatus(draftStatus))
  }

  onFiatInputChange = (amountRequestedInFiat) => {
    amountRequestedInFiat = sanitizeInput(amountRequestedInFiat)
    if (this.invalidInput(amountRequestedInFiat)) { return }

    const amountRequestedInCrypto = getCryptoFromFiat(amountRequestedInFiat, fiatPerCrypto)
    const maxAvailableToSpendInCrypto = this.getMaxAvailableToSpendInCrypto()
    const draftStatus = this.getDraftStatus(amountRequestedInCrypto, maxAvailableToSpendInCrypto)

    this.props.dispatch(setAmountReceivedInCrypto(amountRequestedInCrypto))
    this.props.dispatch(setAmountRequestedInFiat(amountRequestedInFiat))
    this.props.dispatch(setDraftStatus(draftStatus))
  }

  invalidInput = (input) => {
    return (typeof parseInt(input) !== 'number' || isNaN(input))
  }

  getRecipient = () => {
    return this.props.uri
  }

  getMaxAvailableToSpendInCrypto = () => {
    return 123
  }

}

export default connect(state => ({
  sendConfirmation: state.ui.sendConfirmation
})
)(SendConfirmation)
