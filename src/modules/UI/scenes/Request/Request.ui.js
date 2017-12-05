// @flow

import React, {Component} from 'react'
import {
  ActivityIndicator,
  Alert,
  Clipboard,
  View,
  Share
} from 'react-native'
import {bns} from 'biggystring'
import {sprintf} from 'sprintf-js'

import type {AbcCurrencyWallet, AbcEncodeUri} from 'airbitz-core-types'

import styles from './styles.js'
import ExchangedFlipInput from '../../components/FlipInput/ExchangedFlipInput.js'
import ExchangedExchangeRate from '../../components/ExchangeRate/ExchangedExchangeRate.ui.js'
import QRCode from '../../components/QRCode/index.js'
import RequestStatus from '../../components/RequestStatus/index.js'
import ShareButtons from '../../components/ShareButtons/index.js'
import * as UTILS from '../../../utils.js'
import ContactsWrapper from 'react-native-contacts-wrapper'
import Gradient from '../../components/Gradient/Gradient.ui'
import strings from '../../../../locales/default'
import WalletListModal
from '../../../UI/components/WalletListModal/WalletListModalConnector'
import * as WALLET_API from '../../../Core/Wallets/api.js'
import * as Constants from '../../../../constants/indexConstants'

type State = {
  publicAddress: string,
  encodedURI: string,
  loading: boolean,
  result: string
}
type Props = {
  loading: boolean,
  abcWallet: AbcCurrencyWallet,
  currencyCode: string,
  primaryInfo: any,
  secondaryInfo: any,
  secondaryToPrimaryRatio: number,
  request: any,
  saveReceiveAddress(string): void,
}

export default class Request extends Component<Props, State> {
  constructor (props: Props) {
    super(props)
    this.state = {
      publicAddress: '',
      encodedURI: '',
      loading: props.loading,
      result: ''
    }
  }

  componentWillReceiveProps (nextProps: Props) {
    if (nextProps.abcWallet.id !== this.props.abcWallet.id) {
      const {abcWallet, currencyCode} = nextProps
      WALLET_API.getReceiveAddress(abcWallet, currencyCode)
      .then((receiveAddress) => {
        const {publicAddress} = receiveAddress
        const abcEncodeUri: AbcEncodeUri = {publicAddress}
        const encodedURI = this.props.abcWallet.encodeUri ? this.props.abcWallet.encodeUri(abcEncodeUri) : ''
        this.setState({
          encodedURI,
          publicAddress
        })
      })
      .catch((e) => console.log(e))
    }
  }

  componentDidMount () {
    const {abcWallet, currencyCode} = this.props
    if (this.props.loading) return

    WALLET_API.getReceiveAddress(abcWallet, currencyCode)
    .then((receiveAddress) => {
      const {publicAddress} = receiveAddress
      const abcEncodeUri: AbcEncodeUri = {publicAddress}
      const encodedURI = this.props.abcWallet.encodeUri ? this.props.abcWallet.encodeUri(abcEncodeUri) : ''
      this.setState({
        encodedURI,
        publicAddress
      })
    })
    .catch((e) => console.log(e))
  }

  onAmountsChange = ({primaryDisplayAmount}: {primaryDisplayAmount: string}) => {
    const primaryNativeToDenominationRatio = this.props.primaryInfo.displayDenomination.multiplier.toString()
    const primaryNativeAmount = UTILS.convertDisplayToNative(primaryNativeToDenominationRatio)(primaryDisplayAmount)

    const parsedURI = {
      publicAddress: this.state.publicAddress,
      nativeAmount: bns.gt(primaryNativeAmount, '0') ? primaryNativeAmount : null
    }
    const encodedURI = this.props.abcWallet.encodeUri(parsedURI)

    this.setState({
      encodedURI
    })
  }
  renderDropUp = () => {
    if (this.props.showToWalletModal) {
      return (
        <WalletListModal
          topDisplacement={Constants.REQUEST_WALLET_DIALOG_TOP}
          type={Constants.TO}
        />
      )
    }
    return null
  }

  render () {
    if (this.props.loading) {
      return <ActivityIndicator style={{flex: 1, alignSelf: 'center'}} size={'large'}/>
    }

    const color = 'white'
    const {
      secondaryToPrimaryRatio,
      primaryInfo,
      secondaryInfo
    } = this.props
    return (
      <Gradient style={styles.view}>
        <Gradient style={{height: 66, width: '100%'}} />

        <View style={styles.exchangeRateContainer}>
          <ExchangedExchangeRate
            primaryInfo={primaryInfo}
            secondaryInfo={secondaryInfo}
            secondaryToPrimaryRatio={secondaryToPrimaryRatio} />
        </View>

        <View style={styles.main}>
          <ExchangedFlipInput
            primaryInfo={primaryInfo}
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
        {this.renderDropUp()}
      </Gradient>
    )
  }

  copyToClipboard = () => {
    Clipboard.setString(this.state.publicAddress)
    Alert.alert('Request copied to clipboard')
  }

  showResult = (result: {activityType: string}) => {
    if (result.action === Share.sharedAction) {
      this.props.saveReceiveAddress(this.props.request.receiveAddress)

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
    const APP_NAME = 'Edge Wallet'
    Share.share({
      message: this.state.encodedURI,
      title: sprintf(strings.enUS['request_qr_email_title'], APP_NAME)
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
      // console.log('shareViaEmail')
    })
    .catch(() => {
      // console.log('ERROR CODE: ', error.code)
      // console.log('ERROR MESSAGE: ', error.message)
    })
  }

  shareViaSMS = () => {
    ContactsWrapper.getContact().then(() => {
      this.shareMessage()
      // console.log('shareViaSMS')
    })
    .catch(() => {
      // console.log('ERROR CODE: ', error.code)
      // console.log('ERROR MESSAGE: ', error.message)
    })
  }

  shareViaShare = () => {
    this.shareMessage()
    // console.log('shareViaShare')
  }
}
