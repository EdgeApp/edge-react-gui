import React, {Component} from 'react'
import {
  Clipboard,
  View,
  ToastAndroid,
  AlertIOS,
  Platform,
  Share
} from 'react-native'
import {connect} from 'react-redux'
import styles from './styles.js'
import ExchangeRate from '../../components/ExchangeRate/index.js'
import ABQRCode from '../../components/QRCode/index.js'
import RequestStatus from '../../components/RequestStatus/index.js'
import ShareButtons from '../../components/ShareButtons/index.js'
import { convertDenominationToNative } from '../../../utils.js'
import ContactsWrapper from 'react-native-contacts-wrapper'
import LinearGradient from 'react-native-linear-gradient'

import * as CORE_SELECTORS from '../../../Core/selectors.js'
import * as UI_SELECTORS from '../../selectors.js'
import * as SETTINGS_SELECTORS from '../../Settings/selectors.js'

import {
  updateReceiveAddress,
  saveReceiveAddress
} from './action.js'

import { ExchangedFlipInput } from '../../components/FlipInput/ExchangedFlipInput.js'

class Request extends Component {
  constructor (props) {
    super(props)
    this.state = {
      keyboardVisible: false,
      primaryNativeAmount: 0,
      secondaryNativeAmount: 0
    }
  }

  componentDidMount () {
    this.props.updateReceiveAddress(this.props.walletId, this.props.currencyCode)
  }
  _onFocus = () => this.setState({keyboardVisible: true})
  _onBlur = () => this.setState({keyboardVisible: false})

  onAmountsChange = ({ primaryDenominationAmount, secondaryDenominationAmount }) => {
    const primaryNativeToDenominationRatio = this.props.primary.denomination.multiplier
    const secondaryNativeToDenominationRatio = this.props.secondary.denomination.multiplier

    const primaryNativeAmount = convertDenominationToNative(primaryNativeToDenominationRatio)(primaryDenominationAmount)
    const secondaryNativeAmount = convertDenominationToNative(secondaryNativeToDenominationRatio)(secondaryDenominationAmount)

    this.setState({
      primaryNativeAmount,
      secondaryNativeAmount
    }, console.log(`onAmountsChange: primaryDenominationAmount: ${primaryDenominationAmount}, secondaryDenominationAmount: ${secondaryDenominationAmount}\n onAmountsChange: primaryNativeAmount: ${primaryNativeAmount}, secondaryNativeAmount: ${secondaryNativeAmount}`))
  }

  render () {
    console.log('rendering Request.ui, this.state is: ', this.state, ' this.props is: ', this.props)
    const {request = {}} = this.props
    const {receiveAddress = {}} = request
    const {
      publicAddress = '',
      amountSatoshi = null,
      metadata = {}
    } = receiveAddress
    const { amountFiat = null } = metadata
    const color = 'white'
    const { primaryDenominationInfo, secondaryDenominationInfo } = this.props

    return (
      <LinearGradient style={styles.view} start={{x: 0, y: 0}} end={{x: 1, y: 0}}
        colors={['#3b7adb', '#2b569a']}>

        <View style={styles.exchangeRateContainer}>
          <ExchangeRate
            fiatPerCrypto={this.props.fiatPerCrypto}
            fiatCurrencyCode={this.props.fiatCurrencyCode}
            cryptoDenomination={this.props.inputCurrencyDenomination} />
        </View>

        <View style={styles.main}>
          <ExchangedFlipInput
            primaryDenominationInfo={primaryDenominationInfo}
            secondaryDenominationInfo={secondaryDenominationInfo}
            primaryToSecondaryRatio={this.props.fiatPerCrypto}
            onAmountsChange={this.onAmountsChange}
            color={color} />

          <ABQRCode qrCodeText={this.getQrCodeText(publicAddress, amountSatoshi)} />
          <RequestStatus requestAddress={publicAddress} amountRequestedInCrypto={amountSatoshi} amountReceivedInCrypto={amountFiat} />
        </View>

        <View style={styles.shareButtonsContainer}>
          <ShareButtons styles={styles.shareButtons} shareViaEmail={this.shareViaEmail} shareViaSMS={this.shareViaSMS} shareViaShare={this.shareViaShare} copyToClipboard={() => this.copyToClipboard(publicAddress, amountSatoshi)} />
        </View>

      </LinearGradient>
    )
  }

  copyToClipboard = (publicAddress, amountSatoshi) => {
    Clipboard.setString(this.getRequestInfoForClipboard(publicAddress, amountSatoshi))

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
        this.setState({
          result: 'shared with an activityType: ' + result.activityType
        })
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
    }, {dialogTitle: 'Share Airbitz Request'}).then(this.showResult).catch((error) => this.setState({
      result: 'error: ' + error.message
    }))
  }

  shareViaEmail = () => {
    ContactsWrapper.getContact().then((contact) => {
      this.shareMessage()
      console.log('shareViaEmail')
    }).catch((error) => {
      console.log('ERROR CODE: ', error.code)
      console.log('ERROR MESSAGE: ', error.message)
    })
  }

  shareViaSMS = () => {
    ContactsWrapper.getContact().then((contact) => {
      this.shareMessage()
      console.log('shareViaSMS')
    }).catch((error) => {
      console.log('ERROR CODE: ', error.code)
      console.log('ERROR MESSAGE: ', error.message)
    })
  }

  shareViaShare = () => {
    this.shareMessage()
    console.log('shareViaShare')
  }
}

const mapStateToProps = (state) => {
  let fiatPerCrypto = 0
  const wallet = UI_SELECTORS.getSelectedWallet(state)
  const currencyCode = UI_SELECTORS.getSelectedCurrencyCode(state)
  const primaryDenomination = SETTINGS_SELECTORS.getCurrencyDenomination(state, currencyCode)
  const primaryBaseDenomination = SETTINGS_SELECTORS.getBaseDenomination(state, currencyCode)
  const secondaryBaseDenomination = {
    name: 'Dollars',
    symbol: '$',
    multiplier: '100'
  }
  const secondaryDenomination = {
    name: 'Dollars',
    symbol: '$',
    multiplier: '100'
  }
  if (wallet) {
    const isoFiatCurrencyCode = wallet.isoFiatCurrencyCode
    fiatPerCrypto = CORE_SELECTORS.getExchangeRate(state, currencyCode, isoFiatCurrencyCode)
  }

  const primaryDenominationInfo = {
    displayCurrencyCode: currencyCode,
    exchangeCurrencyCode: currencyCode,
    denomination: primaryDenomination,
    baseDenomination: primaryBaseDenomination
  }

  const secondaryDenominationInfo = {
    displayCurrencyCode: wallet.fiatCurrencyCode,
    exchangeCurrencyCode: wallet.isoFiatCurrencyCode,
    denomination: secondaryDenomination,
    baseDenomination: secondaryBaseDenomination
  }

  return {
    request: state.ui.scenes.request,
    fiatPerCrypto,
    wallet,
    currencyCode,
    primaryDenominationInfo,
    secondaryDenominationInfo
  }
}
const mapDispatchToProps = (dispatch) => ({
  updateReceiveAddress: (walletId, currencyCode) => {
    dispatch(updateReceiveAddress(walletId, currencyCode))
  }
})
export default connect(mapStateToProps, mapDispatchToProps)(Request)
