import React, { Component } from 'react'
import {
  View,
  Share,
  Text,
  TouchableHighlight,
  Keyboard,
  Button,
  Platform
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

class SendConfirmation extends Component {
  constructor (props) {
    super(props)

    this.state = {
      amountRequestedInCrypto: 0,
      amountRequestedInFiat: 0,
      amountReceivedInCrypto: 0.75,
      fiatPerCrypto: '1077.75',
      requestAddress: '1F1tAaz5x1HUXrCNLbtMDqcw6o5GNn4xqX',
      inputCurrencySelected: 'crypto',
      label: 'Amalia Miller',
      address: '1F1tAaz5x1HUXrCNLbtMDqcw6o5GNn4xqX',
      maxAvailableToSpendInCrypto: 123,
      pinEnabled: true,
      pin: 1234,
      sliderDisabled: true,
      draftStatus: 'under',
      keyboardVisible: false,
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
    this.setState({
      keyboardVisible: true
    })
  }

  _keyboardHides = () => {
    this.setState({
      keyboardVisible: false
    })
  }

  getPinInputIfEnabled = () => {
    let pinInputIfEnabled

    if (this.state.pinEnabled) {
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
    return (
      <LinearGradient
        style={styles.view}
        start={{x:0,y:0}} end={{x:1, y:0}}
        colors={["#3b7adb","#2b569a"]}>

        <View style={styles.exchangeRateAndMax} >
          <View style={{flex: 1}}></View>

          <View style={{flex: 3}}>
            <ExchangeRate
              mode={this.state.draftStatus}
              style={{flex: 1}}
              fiatPerCrypto={this.state.fiatPerCrypto} />
          </View>

          <View style={{flex: 1}}>
            <MaxButton style={{flex: 1}}
              mode={this.state.draftStatus}
              onMaxPress={this.onMaxPress}/>
          </View>

        </View>

        <View style={styles.flipInput}>
          <FlipInput
            mode={this.state.draftStatus}
            onInputCurrencyToggle={this.onInputCurrencyToggle}
            onCryptoInputChange={this.onCryptoInputChange}
            onFiatInputChange={this.onFiatInputChange}
            amountRequestedInCrypto={this.state.amountRequestedInCrypto}
            amountRequestedInFiat={this.state.amountRequestedInFiat}
            inputCurrencySelected={this.state.inputCurrencySelected}
            maxAvailableToSpendInCrypto={this.state.maxAvailableToSpendInCrypto}
            displayFees
            feeInCrypto={this.getFeeInCrypto()}
            feeInFiat={this.getFeeInFiat()} />
        </View>

        <View style={styles.recipient}>
          <View style={{flex: 3}}>
            <Recipient label={this.state.label} address={this.state.address} />
          </View>

          {this.getPinInputIfEnabled()}
        </View>

        {this.getTopSpacer()}

        <View style={styles.slider}>
          <ABSlider
            style={{
              flex: 1,
            }}
            text={this.state.text}
            sliderDisabled={this.state.sliderDisabled} />
        </View>

        {this.getBottomSpacer()}

      </LinearGradient>
    )
  }

  getTopSpacer = () => {
    if (this.state.keyboardVisible) {
      return
    } else {
      return <View style={styles.spacer} />
    }
  }

  getBottomSpacer = () => {
    if (!this.state.keyboardVisible) {
      return
    } else {
      return <View style={styles.spacer} />
    }
  }

  isPinCorrect = (pin) => {
    const isCorrectPin = (pin === this.state.pin)
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
          sliderDisabled: false
        })
      }
    }
  }

  onMaxPress = () => {
    const amountRequestedInCrypto = this.getMaxAvailableToSpendInCrypto()
    const maxAvailableToSpendInCrypto = this.getMaxAvailableToSpendInCrypto()
    const fiatPerCrypto = this.state.fiatPerCrypto
    const amountRequestedInFiat = getFiatFromCrypto(amountRequestedInCrypto, fiatPerCrypto)
    const draftStatus = this.getDraftStatus(amountRequestedInCrypto, maxAvailableToSpendInCrypto)

    this.setState({
      amountRequestedInCrypto,
      amountRequestedInFiat,
      draftStatus,
    })
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
    const currency =
      this.state.inputCurrencySelected === 'crypto'
        ? 'fiat'
        : 'crypto'

      this.setState({
        inputCurrencySelected: currency
      })
  }

  onCryptoInputChange = (amountRequestedInCrypto) => {
    amountRequestedInCrypto = sanitizeInput(amountRequestedInCrypto)
    if (this.invalidInput(amountRequestedInCrypto)) { return }

    const amountRequestedInFiat = getFiatFromCrypto(amountRequestedInCrypto, this.state.fiatPerCrypto)
    const maxAvailableToSpendInCrypto = this.getMaxAvailableToSpendInCrypto()
    const draftStatus = this.getDraftStatus(amountRequestedInCrypto, maxAvailableToSpendInCrypto)

    this.setState({
      amountRequestedInCrypto,
      amountRequestedInFiat,
      draftStatus,
    })
  }

  onFiatInputChange = (amountRequestedInFiat) => {
    amountRequestedInFiat = sanitizeInput(amountRequestedInFiat)
    if (this.invalidInput(amountRequestedInFiat)) { return }

    const amountRequestedInCrypto = getCryptoFromFiat(amountRequestedInFiat, this.state.fiatPerCrypto)
    const maxAvailableToSpendInCrypto = this.getMaxAvailableToSpendInCrypto()
    const draftStatus = this.getDraftStatus(amountRequestedInCrypto, maxAvailableToSpendInCrypto)

    this.setState({
      amountRequestedInCrypto,
      amountRequestedInFiat,
      draftStatus,
    })
  }

  invalidInput = (input) => {
    return (typeof parseInt(input) !== 'number' || isNaN(input))
  }

  getRecipient = () => {
    return "10c9b2n31cp3nyct13t10x9t39c7"
  }

  getMaxAvailableToSpendInCrypto = () => {
    return 123
  }

}

export default connect()(SendConfirmation)
