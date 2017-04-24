import React, { Component } from 'react'
import {
  Clipboard,
  View,
  ToastAndroid,
  AlertIOS,
  Platform,
  StyleSheet,
  Dimensions,
  Share,
  Text,
  TouchableHighlight
} from 'react-native'
import { connect } from 'react-redux'
// import styles from './styles.js'
import ExchangeRate from '../ExchangeRate/index.js'
import FlipInput from '../FlipInput/index.js'
import ABQRCode from '../QRCode/index.js'
import RequestStatus from '../RequestStatus/index.js'
import ShareButtons from '../ShareButtons/index.js'
import { getCryptoFromFiat, getFiatFromCrypto, sanitizeInput } from '../utils.js'
import ContactsWrapper from 'react-native-contacts-wrapper'
import LinearGradient from 'react-native-linear-gradient'

const ScreenHeight = Dimensions.get('window').height

import { dev } from '../utils.js'

const styles = StyleSheet.create({
  view: {
    flex: 1,
    padding: 5,
    bottom: 0,
  },
  exchangeRateContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  flipInputContainer: {
    flex: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  abQRCodeContainer: {
    flex: 6,
    padding: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  requestStatusContainer: {
    flex: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareButtonsContainer: {
    flex: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareButtons: {
    flex: 1
  }
})

class Request extends Component {
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

        <View style={styles.exchangeRateContainer}>
          <ExchangeRate
            fiatPerCrypto={this.state.fiatPerCrypto} />
        </View>

        <View style={styles.flipInputContainer}>
          <FlipInput
            onInputCurrencyToggle={this.onInputCurrencyToggle}
            onCryptoInputChange={this.onCryptoInputChange}
            onFiatInputChange={this.onFiatInputChange}
            amountRequestedInCrypto={this.state.amountRequestedInCrypto}
            amountRequestedInFiat={this.state.amountRequestedInFiat}
            inputCurrencySelected={this.state.inputCurrencySelected} />
        </View>

        <View style={styles.abQRCodeContainer}>
          <ABQRCode qrCodeText={this.getQrCodeText()} />
        </View>

        <View style={styles.requestStatusContainer}>
          <RequestStatus
            requestAddress={this.state.requestAddress}
            amountRequestedInCrypto={this.state.amountRequestedInCrypto} amountReceivedInCrypto={this.state.amountReceivedInCrypto} />
        </View>

        <View style={styles.shareButtonsContainer}>
          <ShareButtons
            styles={styles.shareButtons}
            shareViaEmail={this.shareViaEmail}
            shareViaSMS={this.shareViaSMS}
            shareViaShare={this.shareViaShare}
            copyToClipboard={this.copyToClipboard} />
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

  copyToClipboard = () => {
    Clipboard.setString(
      this.getRequestInfoForClipboard()
    )

    if (Platform.OS === 'android') {
      ToastAndroid.show('Request copied to clipboard', ToastAndroid.SHORT)
    } else if (Platform.OS === 'ios') {
      AlertIOS.alert('Request copied to clipboard')
    }
  }

  getQrCodeText = () => {
    return 'bitcoin:' + this.state.requestAddress +
    '?amount=' + this.state.amountRequestedInCrypto
  }

  getRequestInfoForClipboard = () => {
    return 'bitcoin:' + this.state.requestAddress +
    '?amount=' + this.state.amountRequestedInCrypto
  }

  getRequestInfoForShare = () => {
    return 'bitcoin:' + this.state.requestAddress +
    '?amount=' + this.state.amountRequestedInCrypto
  }

  invalidInput = (input) => {
    return (typeof parseInt(input) !== 'number' || isNaN(input))
  }

  showResult(result) {
    if (result.action === Share.sharedAction) {
      if (result.activityType) {
        this.setState({result: 'shared with an activityType: ' + result.activityType});
      } else {
        this.setState({result: 'shared'});
      }
    } else if (result.action === Share.dismissedAction) {
      this.setState({result: 'dismissed'});
    }
  }

  shareMessage = () => {
    Share.share({
      message: this.getRequestInfoForShare(),
      url: 'https://airbitz.co',
      title: 'Share Airbitz Request'
    }, {
      dialogTitle: 'Share Airbitz Request',
    })
    .then(this.showResult)
    .catch((error) => this.setState({result: 'error: ' + error.message}));
  }

  shareViaEmail = () => {
    ContactsWrapper.getContact()
        .then((contact) => {
            this.shareMessage()
            console.log('shareViaEmail')
        })
        .catch((error) => {
            console.log("ERROR CODE: ", error.code);
            console.log("ERROR MESSAGE: ", error.message);
        })
  }

  shareViaSMS = () => {
    ContactsWrapper.getContact()
        .then((contact) => {
            this.shareMessage()
            console.log('shareViaSMS')
        })
        .catch((error) => {
            console.log("ERROR CODE: ", error.code);
            console.log("ERROR MESSAGE: ", error.message);
        })
  }

  shareViaShare = () => {
    this.shareMessage()
    console.log("shareViaShare")
  }

}

export default connect()(Request)
