import React, { Component } from 'react'
import {
  View,
  ToastAndroid,
  AlertIOS,
  Platform,
  StyleSheet,
  Dimensions,
  Share,
  Text,
  TouchableHighlight,
  TouchableWithoutFeedback,
  Keyboard,
  Button
} from 'react-native'
import { connect } from 'react-redux'
// import styles from './styles.js'
import ExchangeRate from '../ExchangeRate/index.js'
import MaxButton from '../MaxButton/index.js'
import FlipInput from '../FlipInput/index.js'

import ABQRCode from '../QRCode/index.js'
import RequestStatus from '../RequestStatus/index.js'
import ShareButtons from '../ShareButtons/index.js'

import Recipient from '../Recipient/index.js'
import PinInput from '../PinInput/index.js'
import ABSlider from '../Slider/index.js'
import Fees from '../Fees/index.js'

import { getCryptoFromFiat, getFiatFromCrypto, sanitizeInput } from '../utils.js'
import LinearGradient from 'react-native-linear-gradient'

const ScreenHeight = Dimensions.get('window').height

const styles = StyleSheet.create({
  view: {
    flex: 1,
    padding: 5,
    bottom: 0,
    backgroundColor: 'transparent'
  },
  exchangeRateAndMax: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent'
  },
  flipInput: {
    flex: 4,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent'
  },
  spacer: {
    flex: 6,
    padding: 5,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent'
  },
  recipientAndPinInput: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent'
  },
  slider: {
    flex: 2,
    backgroundColor: 'transparent',
  }
})

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
      sliderDisabled: true
    }
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
              style={{flex: 1}}
              fiatPerCrypto={this.state.fiatPerCrypto} />
          </View>

          <View style={{flex: 1}}>
            <MaxButton style={{flex: 1}}
              onMaxPress={this.onMaxPress}/>
          </View>

        </View>

        <View style={styles.flipInput}>
          <FlipInput
            onInputCurrencyToggle={this.onInputCurrencyToggle}
            onCryptoInputChange={this.onCryptoInputChange}
            onFiatInputChange={this.onFiatInputChange}
            amountRequestedInCrypto={this.state.amountRequestedInCrypto}
            amountRequestedInFiat={this.state.amountRequestedInFiat}
            inputCurrencySelected={this.state.inputCurrencySelected}
            maxAvailableToSpendInCrypto={this.state.maxAvailableToSpendInCrypto}
            displayFees />
        </View>

        <View style={styles.recipientAndPinInput}>
          <View style={{flex: 3}}>
            <Recipient label={this.state.label} address={this.state.address}/>
          </View>

          <View style={{flex: 1}}>
            <PinInput onPinChange={this.onPinChange} />
          </View>
        </View>

        <View style={styles.spacer} />

        <View style={styles.slider}>
          <ABSlider
            text={this.state.text}
            sliderDisabled={this.state.sliderDisabled}/>
        </View>

      </LinearGradient>
    )
  }

  isPinCorrect = (pin) => {
    const isCorrectPin = (pin === this.state.pin)
    console.log('Correct PIN')

    return isCorrectPin
  }

  onPinChange = (pin) => {
    console.log('pin: ' + pin)
    if (pin.length >= 4 && this.isPinCorrect(parseInt(pin))) {
      console.log("Slider Enabled")
      Keyboard.dismiss()

      this.setState({
        sliderDisabled: false
      })
    }
  }

  onMaxPress = () => {
    const {
      maxAvailableToSpendInCrypto,
      fiatPerCrypto
     } = this.state

    this.setState({
      amountRequestedInCrypto: maxAvailableToSpendInCrypto,
      amountRequestedInFiat: getFiatFromCrypto(maxAvailableToSpendInCrypto, fiatPerCrypto)
    })
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

    this.setState({
      amountRequestedInCrypto: amountRequestedInCrypto,
      amountRequestedInFiat:
        getFiatFromCrypto(amountRequestedInCrypto, this.state.fiatPerCrypto)
    })
  }

  onFiatInputChange = (amountRequestedInFiat) => {
    amountRequestedInFiat = sanitizeInput(amountRequestedInFiat)
    if (this.invalidInput(amountRequestedInFiat)) { return }

    this.setState({
      amountRequestedInCrypto:
        getCryptoFromFiat(amountRequestedInFiat, this.state.fiatPerCrypto),
      amountRequestedInFiat: amountRequestedInFiat
    })
  }

  invalidInput = (input) => {
    return (typeof parseInt(input) !== 'number' || isNaN(input))
  }

  onPressMax = () => {
    console.log('Pressed Max')
  }

  getRecipient = () => {
    return "10c9b2n31cp3nyct13t10x9t39c7"
  }
}

export default connect()(SendConfirmation)
