import React, {Component} from 'react'
import {
  Clipboard,
  View,
  Share
} from 'react-native'
import Alert from './alert'
import {connect} from 'react-redux'
import styles from './styles.js'
import ExchangedFlipInput from '../../components/FlipInput/ExchangedFlipInput.js'
import ExchangedExchangeRate from '../../components/ExchangeRate/ExchangedExchangeRate.ui.js'
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

import { saveReceiveAddress } from './action.js'

class Request extends Component {
  constructor (props) {
    super(props)
    this.state = {
      primaryNativeAmount: '',
      secondaryNativeAmount: '',
      encodedURI: ''
    }
  }

  componentWillReceiveProps (nextProps) {
    if (nextProps.coreWallet.id !== this.props.coreWallet.id) {
      const { coreWallet, currencyCode } = nextProps
      WALLET_API.getReceiveAddress(coreWallet, currencyCode)
      .then(receiveAddress => {
        const { publicAddress } = receiveAddress
        console.log('in request->ComponentWillReceiveProps, receiveAddress is: ', receiveAddress, ' , coreWallet is: ', coreWallet, ' , and currencyCode is: ', currencyCode)
        const encodedURI = this.props.coreWallet.encodeUri(receiveAddress)
        this.setState({
          encodedURI,
          publicAddress
        })
      })
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
      secondaryToPrimaryRatio,
      primaryInfo,
      secondaryInfo
    } = this.props
    const nativeAmount = this.state.primaryNativeAmount
    return (
      <LinearGradient style={styles.view} start={{x: 0, y: 0}} end={{x: 1, y: 0}}
        colors={['#3b7adb', '#2b569a']}>

        <View style={styles.exchangeRateContainer}>
          <ExchangedExchangeRate
            primaryInfo={primaryInfo}
            secondaryInfo={secondaryInfo}
            secondaryToPrimaryRatio={secondaryToPrimaryRatio} />
        </View>

        <View style={styles.main}>
          <ExchangedFlipInput
            primaryInfo={{...primaryInfo, nativeAmount}}
            secondaryInfo={secondaryInfo}
            secondaryToPrimaryRatio={secondaryToPrimaryRatio}
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
    Alert.alert('Request copied to clipboard')
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
    .then(() => {
      this.shareMessage()
      console.log('shareViaEmail')
    }).catch((error) => {
      console.log('ERROR CODE: ', error.code)
      console.log('ERROR MESSAGE: ', error.message)
    })
  }

  shareViaSMS = () => {
    ContactsWrapper.getContact().then(() => {
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
  let secondaryToPrimaryRatio = 0
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
    secondaryToPrimaryRatio = CORE_SELECTORS.getExchangeRate(state, currencyCode, isoFiatCurrencyCode)
  }

  return {
    request: state.ui.scenes.request,
    coreWallet,
    secondaryToPrimaryRatio,
    wallet,
    currencyCode,
    primaryInfo,
    secondaryInfo
  }
}
const mapDispatchToProps = () => ({})
export default connect(mapStateToProps, mapDispatchToProps)(Request)
