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
import QRCode from '../../components/QRCode/index.js'
import RequestStatus from '../../components/RequestStatus/index.js'
import ShareButtons from '../../components/ShareButtons/index.js'
import { convertDisplayToNative } from '../../../utils.js'
import ContactsWrapper from 'react-native-contacts-wrapper'
import LinearGradient from 'react-native-linear-gradient'

import * as WALLET_API from '../../../Core/Wallets/api.js'
import * as CORE_SELECTORS from '../../../Core/selectors.js'
import * as UI_SELECTORS from '../../selectors.js'
import * as SETTINGS_SELECTORS from '../../Settings/selectors.js'

import {
  saveReceiveAddress
} from './action.js'

import ExchangedFlipInput from '../../components/FlipInput/ExchangedFlipInput.js'

class Request extends Component {
  constructor (props) {
    super(props)
    this.state = {
      primaryNativeAmount: '',
      secondaryNativeAmount: '',
      encodedURI: ''
    }
  }

  componentDidMount () {
    const { coreWallet, currencyCode } = this.props
    WALLET_API.getReceiveAddress(coreWallet, currencyCode)
    .then(receiveAddress => {
      const { publicAddress } = receiveAddress
      const encodedURI = this.props.coreWallet.encodeUri(receiveAddress)
      this.setState({
        encodedURI,
        publicAddress
      })
    })
  }

  onAmountsChange = ({ primaryDisplayAmount, secondaryDisplayAmount }) => {
    const primaryNativeToDenominationRatio = this.props.primaryInfo.displayDenomination.multiplier.toString()
    const secondaryNativeToDenominationRatio = this.props.secondaryInfo.displayDenomination.multiplier.toString()

    const primaryNativeAmount = convertDisplayToNative(primaryNativeToDenominationRatio)(primaryDisplayAmount)
    const secondaryNativeAmount = convertDisplayToNative(secondaryNativeToDenominationRatio)(secondaryDisplayAmount)

    const parsedURI = {
      publicAddress: this.state.publicAddress,
      nativeAmount: primaryNativeAmount
    }
    const encodedURI = this.props.coreWallet.encodeUri(parsedURI)

    this.setState({
      primaryNativeAmount,
      secondaryNativeAmount,
      encodedURI
    })
  }

  render () {
    const color = 'white'
    const {
      fiatPerCrypto,
      primaryInfo,
      secondaryInfo
    } = this.props
    const nativeAmount = this.state.primaryNativeAmount
    return (
      <LinearGradient style={styles.view} start={{x: 0, y: 0}} end={{x: 1, y: 0}}
        colors={['#3b7adb', '#2b569a']}>

        <View style={styles.exchangeRateContainer}>
          <ExchangeRate
            fiatPerCrypto={fiatPerCrypto}
            primaryInfo={primaryInfo}
            secondaryInfo={secondaryInfo} />
        </View>

        <View style={styles.main}>
          <ExchangedFlipInput
            primaryInfo={{...primaryInfo, nativeAmount}}
            secondaryInfo={secondaryInfo}
            secondaryToPrimaryRatio={fiatPerCrypto}
            onAmountsChange={this.onAmountsChange}
            color={color} />

          <QRCode value={this.state.encodedURI} />
          <RequestStatus requestAddress={this.state.publicAddress} amountRequestedInCrypto={0} amountReceivedInCrypto={0} />
        </View>

        <View style={styles.shareButtonsContainer}>
          <ShareButtons styles={styles.shareButtons} shareViaEmail={this.shareViaEmail} shareViaSMS={this.shareViaSMS} shareViaShare={this.shareViaShare} copyToClipboard={this.copyToClipboard} />
        </View>

      </LinearGradient>
    )
  }

  copyToClipboard = () => {
    Clipboard.setString(this.state.encodedURI)

    if (Platform.OS === 'android') { // needs internationalization and string replacement still
      ToastAndroid.show('Request copied to clipboard', ToastAndroid.SHORT)
    } else if (Platform.OS === 'ios') {
      AlertIOS.alert('Request copied to clipboard')
    }
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
      message: this.state.encodedURI,
      url: 'https://airbitz.co', // will need to refactor for white labeling
      title: 'Share Airbitz Request'
    }, {dialogTitle: 'Share Airbitz Request'})
    .then(this.showResult)
    .catch((error) => this.setState({
      result: 'error: ' + error.message
    }))
  }

  shareViaEmail = () => {
    ContactsWrapper.getContact()
    .then((contact) => {
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
    displayDenomination: primaryDisplayDenomination,
    exchangeDenomination: primaryExchangeDenomination
  }
  const secondaryInfo = {
    displayCurrencyCode: wallet.fiatCurrencyCode,
    displayDenomination: secondaryDisplayDenomination,
    exchangeDenomination: secondaryExchangeDenomination
  }
  if (wallet) {
    const isoFiatCurrencyCode = wallet.isoFiatCurrencyCode
    console.warn('REMOVE BEFORE FLIGHT')
    fiatPerCrypto = CORE_SELECTORS.getFakeExchangeRate(state, currencyCode, isoFiatCurrencyCode)
    // fiatPerCrypto = CORE_SELECTORS.getExchangeRate(state, currencyCode, isoFiatCurrencyCode)
  }

  return {
    request: state.ui.scenes.request,
    coreWallet,
    fiatPerCrypto,
    wallet,
    currencyCode,
    primaryInfo,
    secondaryInfo
  }
}
const mapDispatchToProps = (dispatch) => ({})
export default connect(mapStateToProps, mapDispatchToProps)(Request)
