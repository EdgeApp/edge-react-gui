import React, { Component } from 'react'
import {
  Clipboard,
  View,
  ToastAndroid,
  AlertIOS,
  Platform,
  Dimensions,
  Share,
  Text,
  TouchableHighlight
} from 'react-native'
import { connect } from 'react-redux'
import styles from './styles.js'
import ExchangeRate from '../../components/ExchangeRate/index.js'
import FlipInput from '../../components/FlipInput/index.js'
import ABQRCode from '../../components/QRCode/index.js'
import RequestStatus from '../../components/RequestStatus/index.js'
import ShareButtons from '../../components/ShareButtons/index.js'
import { getCryptoFromFiat, getFiatFromCrypto, sanitizeInput, dev } from '../../../utils.js'
import ContactsWrapper from 'react-native-contacts-wrapper'
import LinearGradient from 'react-native-linear-gradient'
import { Actions } from 'react-native-router-flux'

import {
  addReceiveAddress,
  updateAmountRequestedInCrypto,
  updateAmountReceivedInCrypto,
} from './Request.action.js'

class Request extends Component {
  constructor (props) {
    super(props)

    this.state = {
      request: props.request,
      amountRequestedInFiat: 0,
      fiatPerCrypto: '1077.75',
      inputCurrencySelected: 'crypto',
      result: ''
    }
  }

  componentWillMount () {
    const { request } = this.props

    if (request.amountRequestedInCrypto != 0 && request.amountReceivedInCrypto >= request.amountRequestedInCrypto) {
      alert("Asd")
      Actions.directory()
    }
  }

  componentDidMount () {
    if (!this.props.request.receiveAddress && this.props.selectedWallet) {
      const receiveAddress = this.props.selectedWallet.getReceiveAddress().address
      this.props.dispatch(addReceiveAddress(receiveAddress))
    }

    setTimeout(() => {
      this.props.dispatch(updateAmountReceivedInCrypto(Math.random() * 5))}, 3000)
  }

  render () {
    const { request } = this.props

    return (
      <LinearGradient
        style={styles.view}
        start={{x:0,y:0}} end={{x:1, y:0}}
        colors={["#3b7adb","#2b569a"]}>

        <View style={styles.exchangeRateContainer}>
          <ExchangeRate
            fiatPerCrypto={this.props.fiatPerCrypto} />
        </View>

        <View style={styles.flipInputContainer}>
          <FlipInput
            onCryptoInputChange={this.onCryptoInputChange}
            onFiatInputChange={this.onFiatInputChange}
            amountRequestedInCrypto={request.amountRequestedInCrypto}
            amountRequestedInFiat={this.state.amountRequestedInFiat}
            inputCurrencySelected={this.state.inputCurrencySelected} />
        </View>

        <View style={styles.abQRCodeContainer}>
          <ABQRCode qrCodeText={this.getQrCodeText()} />
        </View>

        <View style={styles.requestStatusContainer}>
          <RequestStatus
            requestAddress={request.requestAddress}
            amountRequestedInCrypto={request.amountRequestedInCrypto}
            amountReceivedInCrypto={request.amountReceivedInCrypto} />
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

  onCryptoInputChange = (amountRequestedInCrypto) => {
    amountRequestedInCrypto = sanitizeInput(amountRequestedInCrypto)
    if (this.invalidInput(amountRequestedInCrypto)) { return }

    this.props.dispatch(updateAmountRequestedInCrypto(amountRequestedInCrypto))

    this.setState({
      amountRequestedInFiat:
        getFiatFromCrypto(amountRequestedInCrypto, this.state.fiatPerCrypto)
    })
  }

  onFiatInputChange = (amountRequestedInFiat) => {
    amountRequestedInFiat = sanitizeInput(amountRequestedInFiat)
    if (this.invalidInput(amountRequestedInFiat)) { return }

    const amountRequestedInCrypto = getCryptoFromFiat(amountRequestedInFiat, this.state.fiatPerCrypto)
    this.props.dispatch(updateAmountRequestedInCrypto(amountRequestedInCrypto))

    this.setState({
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
    const qrCodeText =
      'bitcoin:' + this.props.request.receiveAddress +
      '?amount=' + (this.props.request.amountRequestedInCrypto - this.props.request.amountReceivedInCrypto)

    return qrCodeText
  }

  getRequestInfoForClipboard = () => {
    const requestInfoForClipboard =
      'bitcoin:' + this.props.request.requestAddress +
      '?amount=' + (this.props.request.amountRequestedInCrypto - this.props.request.amountReceivedInCrypto)

    return requestInfoForClipboard
  }

  getRequestInfoForShare = () => {
    const requestInforForShare =
      'bitcoin:' + this.props.request.requestAddress +
      '?amount=' + (this.props.request.amountRequestedInCrypto - this.props.request.amountReceivedInCrypto)

    return requestInforForShare
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

export default connect(state => ({

  request: state.request,
  selectedWallet: state.selectedWallet

}))(Request)
