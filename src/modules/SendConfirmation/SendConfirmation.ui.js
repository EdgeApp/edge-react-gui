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
  Keyboard
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
    bottom: 0,
    padding: 5
  },
  exchangeRate: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flipInput: {
    flex: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  spacer: {
    flex: 6,
    padding: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recipientAndPinInput: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  slider: {
    flex: 2,
    alignItems: 'center',
    justifyContent: 'center',
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
      result: ''
    }
  }

  render () {
    return (
      <LinearGradient
        style={styles.view}
        start={{x:0,y:0}} end={{x:1, y:0}}
        colors={["#3b7adb","#2b569a"]}>
        
        <View style={styles.exchangeRate} >
          <ExchangeRate
            fiatPerCrypto={this.state.fiatPerCrypto} />
        </View>

        <View style={styles.flipInput}>
          <FlipInput
          onInputCurrencyToggle={this.onInputCurrencyToggle}
          onCryptoInputChange={this.onCryptoInputChange}
          onFiatInputChange={this.onFiatInputChange}
          amountRequestedInCrypto={this.state.amountRequestedInCrypto}
          amountRequestedInFiat={this.state.amountRequestedInFiat}
          inputCurrencySelected={this.state.inputCurrencySelected}
          displayFees />
        </View>

        <View style={styles.recipientAndPinInput}>
          <View style={{flex: 3}}>
            <Recipient />
          </View>

        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={{flex: 1}}>
            <PinInput />
          </View>
        </TouchableWithoutFeedback>
        </View>

        <View style={styles.spacer} />

        <View style={styles.slider}>
          <ABSlider />
        </View>

      </LinearGradient>
    )
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


// {/* <MaxButton onPressMax={this.onPressMax}/> */}
{/* <View style={styles.view}>
  <LinearGradient
    start={{x:0,y:0}} end={{x:1, y:0}}
    style={{flex: 1,padding: 10}}
    colors={["#3b7adb", "#2b569a"]}>

      <ExchangeRate
        fiatPerCrypto={this.state.fiatPerCrypto}
        style={styles.exchangeRate} />

      <View style={{
        flex: 2
      }}>
      <FlipInput
        onInputCurrencyToggle={this.onInputCurrencyToggle}
        style={styles.flipInput}
        onCryptoInputChange={this.onCryptoInputChange}
        onFiatInputChange={this.onFiatInputChange}
        amountRequestedInCrypto={this.state.amountRequestedInCrypto}
        amountRequestedInFiat={this.state.amountRequestedInFiat}
        inputCurrencySelected={this.state.inputCurrencySelected} />
      </View>

      <View style={styles.row}>
        <Recipient
          to={this.getRecipient()}
          style={{flex: 3}} />
        <PinInput
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center'
        }} />
      </View>

    <View style={styles.spacer}></View>

  <ABSlider style={styles.slider} />

  </LinearGradient>
</View> */}
