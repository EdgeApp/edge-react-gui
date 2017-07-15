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

import {
  addReceiveAddress,
  updateReceiveAddress,
  updateAmountRequestedInCrypto,
  updateAmountRequestedInFiat,
  updateAmountReceivedInCrypto,
  saveReceiveAddress,
  updateInputCurrencySelected  
} from './action.js'

class Request extends Component {
  constructor (props) {
    super(props)
    this.state = {
      keyboardVisible: false
    }    
  }

  componentDidMount () {
    this.props.dispatch(updateReceiveAddress())
  }

  _onFocus = () => {
    this.setState({keyboardVisible: true})
  }

  _onBlur = () => {
    this.setState({keyboardVisible: false})    
  }

  /*onInputCurrencyToggle = () => {
    console.log('SendConfirmation->onInputCurrencyToggle called')
    const { inputCurrencySelected } = this.props
    const nextInputCurrencySelected =
      inputCurrencySelected === 'crypto'
        ? 'fiat'
        : 'crypto'

      this.props.dispatch(updateInputCurrencySelected(nextInputCurrencySelected))
  }*/

  render () {
    console.log('rendering Request.ui, this.state is: ', this.state, ' this.props is: ', this.props)
    const { request = {} } = this.props
    const { receiveAddress = {} } = request
    const { publicAddress = '', amountSatoshi = null, metadata = {} } = receiveAddress
    const { amountFiat = null } = metadata

    return (
      <LinearGradient
        style={styles.view}
        start={{x: 0, y: 0}} end={{x: 1, y: 0}}
        colors={['#3b7adb', '#2b569a']}
      >

        <View style={styles.exchangeRateContainer}>
          <ExchangeRate 
          fiatPerCrypto={this.props.fiatPerCrypto} 
          fiatCurrencyCode={this.props.fiatCurrencyCode} 
          cryptoDenom={this.props.inputCurrencyDenom} 
          />
        </View>

        <View style={styles.main}>
          {this.props.inputCurrencySelected === 'crypto' ? (
            <FlipInput
              onCryptoInputChange={this.onCryptoInputChange}
              onFiatInputChange={this.onFiatInputChange}
              amountSatoshi={amountSatoshi || 0}
              amountFiat={amountFiat}
              inputCurrencySelected={this.props.inputCurrencySelected} // crypto
              cryptoDenom={this.props.inputCurrencyDenom}
              fiatCurrencyCode={this.props.fiatCurrencyCode} 
              inputOnFocus={this._onFocus}
              inputOnBlur={this._onBlur}              
            />            
          ) :  (
            <FlipInput
              onCryptoInputChange={this.onCryptoInputChange}
              onFiatInputChange={this.onFiatInputChange}
              amountSatoshi={amountSatoshi || 0}
              amountFiat={amountFiat}
              inputCurrencySelected={this.props.inputCurrencySelected} // fiat
              cryptoDenom={this.props.inputCurrencyDenom}
              fiatCurrencyCode={this.props.fiatCurrencyCode} 
              inputOnFocus={this._onFocus}
              inputOnBlur={this._onBlur}              
            />
          ) }         

          <ABQRCode qrCodeText={this.getQrCodeText(publicAddress, amountSatoshi)} />
          <RequestStatus
            requestAddress={publicAddress}
            amountRequestedInCrypto={amountSatoshi}
            amountReceivedInCrypto={amountFiat}
          />
        </View>

        <View style={styles.shareButtonsContainer}>
          <ShareButtons
            styles={styles.shareButtons}
            shareViaEmail={this.shareViaEmail}
            shareViaSMS={this.shareViaSMS}
            shareViaShare={this.shareViaShare}
            copyToClipboard={() => this.copyToClipboard(publicAddress, amountSatoshi)}
          />
        </View>

      </LinearGradient>
    )
  }

  ///////////////// Start Critical Input and Conversion Area //////////////////////
  onCryptoInputChange = (amountRequestedInCrypto) => {
    console.log('inside Request.ui->onCryptoInputChange, amountRequestedInCrypto is: ' , amountRequestedInCrypto)
    amountRequestedInCrypto = sanitizeInput(amountRequestedInCrypto)
    if (this.invalidInput(amountRequestedInCrypto)) { return }
    const amountRequestedInFiat = getFiatFromCrypto(amountRequestedInCrypto, this.props.fiatPerCrypto)

    this.props.dispatch(updateAmountRequestedInCrypto(amountRequestedInCrypto))
    this.props.dispatch(updateAmountRequestedInFiat(amountRequestedInFiat))
  }

  onFiatInputChange = (amountRequestedInFiat) => {
    console.log('inside Request.ui->onCryptoInputChange, amountRequestedInCrypto is: ' , amountRequestedInCrypto)    
    amountRequestedInFiat = sanitizeInput(amountRequestedInFiat)
    if (this.invalidInput(amountRequestedInFiat)) { return }

    const amountRequestedInCrypto = getCryptoFromFiat(amountRequestedInFiat, this.props.fiatPerCrypto)
    this.props.dispatch(updateAmountRequestedInCrypto(amountRequestedInCrypto))
    this.props.dispatch(updateAmountRequestedInFiat(amountRequestedInFiat))
  }
///////////////// End Critical Input and Conversion Area //////////////////////
  copyToClipboard = (publicAddress, amountSatoshi) => {
    Clipboard.setString(
      this.getRequestInfoForClipboard(publicAddress, amountSatoshi)
    )

    if (Platform.OS === 'android') { // needs internationalization and string replacement still
      ToastAndroid.show('Request copied to clipboard', ToastAndroid.SHORT)
    } else if (Platform.OS === 'ios') {
      AlertIOS.alert('Request copied to clipboard')
    }
  }

  getQrCodeText = (publicAddress, amountSatoshi) => {
    const qrCodeText = publicAddress

    return qrCodeText
  }

  getRequestInfoForClipboard = (publicAddress, amountSatoshi) => {
    const requestInfoForClipboard = publicAddress

    return requestInfoForClipboard
  }

  getRequestInfoForShare = (publicAddress, amountSatoshi) => {
    const requestInforForShare = publicAddress

    return requestInforForShare
  }

  invalidInput = (input) => {
    return (typeof parseInt(input) !== 'number' || isNaN(input))
  }

  showResult = (result) => {
    if (result.action === Share.sharedAction) {
      this.props.dispatch(saveReceiveAddress(this.props.request.receiveAddress))

      if (result.activityType) {
        this.setState({result: 'shared with an activityType: ' + result.activityType})
      } else {
        this.setState({result: 'shared'})
      }
    } else if (result.action === Share.dismissedAction) {
      this.setState({result: 'dismissed'})
    }
  }

  shareMessage = () => {
    Share.share({
      message: this.getRequestInfoForShare(),
      url: 'https://airbitz.co', // will need to refactor for white labeling
      title: 'Share Airbitz Request'
    }, {
      dialogTitle: 'Share Airbitz Request'
    })
    .then(this.showResult)
    .catch((error) => this.setState({result: 'error: ' + error.message}))
  }

  shareViaEmail = () => {
    ContactsWrapper.getContact()
    .then((contact) => {
      this.shareMessage()
      console.log('shareViaEmail')
    })
    .catch((error) => {
      console.log('ERROR CODE: ', error.code)
      console.log('ERROR MESSAGE: ', error.message)
    })
  }

  shareViaSMS = () => {
    ContactsWrapper.getContact()
    .then((contact) => {
      this.shareMessage()
      console.log('shareViaSMS')
    })
    .catch((error) => {
      console.log('ERROR CODE: ', error.code)
      console.log('ERROR MESSAGE: ', error.message)
    })
  }

  shareViaShare = () => {
    this.shareMessage()
    console.log('shareViaShare')
  }
}

export default connect(state => ({

  request: state.ui.scenes.request,
  wallets: state.ui.wallets,
  settings: state.ui.settings,
  inputCurrencySelected: state.ui.scenes.request.inputCurrencySelected,
  inputCurrencyDenom: state.ui.wallets.byId[state.ui.wallets.selectedWalletId].denominations[state.ui.settings[state.ui.wallets.byId[state.ui.wallets.selectedWalletId].currencyCode].denomination -1]  ,
  // ^ Don't laugh...  =P  
  fiatCurrencyCode: state.core.wallets.byId[state.ui.wallets.selectedWalletId].fiatCurrencyCode,
  fiatPerCrypto:  state.ui.scenes.exchangeRate.exchangeRates[state.ui.wallets.byId[state.ui.wallets.selectedWalletId].currencyCode].value,
}))(Request)
