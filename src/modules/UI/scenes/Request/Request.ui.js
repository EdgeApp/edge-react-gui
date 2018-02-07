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

import type {AbcCurrencyWallet, AbcEncodeUri} from 'edge-login'

import styles from './styles.js'
import { ExchangedFlipInput, type ExchangedFlipInputAmounts } from '../../components/FlipInput/ExchangedFlipInput2.js'
import ExchangedExchangeRate from '../../components/ExchangeRate/ExchangedExchangeRate.ui.js'
import QRCode from '../../components/QRCode/index.js'
import RequestStatus from '../../components/RequestStatus/index.js'
import ShareButtons from '../../components/ShareButtons/index.js'
import ContactsWrapper from 'react-native-contacts-wrapper'
import Gradient from '../../components/Gradient/Gradient.ui'
import SafeAreaView from '../../components/SafeAreaView/index.js'
import s from '../../../../locales/strings.js'
import WalletListModal
from '../../../UI/components/WalletListModal/WalletListModalConnector'
import * as WALLET_API from '../../../Core/Wallets/api.js'
import * as Constants from '../../../../constants/indexConstants'
import type {
  GuiTransactionRequest,
  GuiCurrencyInfo,
  GuiWallet,
  GuiReceiveAddress
} from '../../../../types.js'

type State = {
  publicAddress: string,
  encodedURI: string,
  loading: boolean,
  result: string
}

export type RequestStateProps = {
  loading: boolean,
  currencyCode: string,
  // next line will need review
  request: GuiTransactionRequest | Object,
  abcWallet: AbcCurrencyWallet | null,
  guiWallet: GuiWallet | null,
  exchangeSecondaryToPrimaryRatio: number,
  currencyCode: string,
  primaryCurrencyInfo: GuiCurrencyInfo,
  secondaryCurrencyInfo: GuiCurrencyInfo,
  showToWalletModal: boolean
}

export type RequestDispatchProps = {
  saveReceiveAddress(GuiReceiveAddress): any,
}

type Props = RequestStateProps & RequestDispatchProps

export class Request extends Component<Props, State> {
  constructor (props: Props) {
    super(props)
    const newState: State = {
      publicAddress: '',
      encodedURI: '',
      loading: props.loading,
      result: ''
    }
    this.state = newState
  }

  componentWillReceiveProps (nextProps: Props) {
    if (nextProps.abcWallet && (!this.props.abcWallet || nextProps.abcWallet.id !== this.props.abcWallet.id)) {
      const abcWallet: AbcCurrencyWallet | null = nextProps.abcWallet
      const {currencyCode} = nextProps
      if (!abcWallet) return
      WALLET_API.getReceiveAddress(abcWallet, currencyCode)
      .then((receiveAddress) => {
        const {publicAddress} = receiveAddress
        const abcEncodeUri: AbcEncodeUri = {publicAddress}
        const encodedURI = nextProps.abcWallet ? nextProps.abcWallet.encodeUri(abcEncodeUri) : ''
        this.setState({
          encodedURI,
          publicAddress
        })
      })
      .catch((e) => {
        this.setState({encodedURI: '', publicAddress: ''})
        console.log(e)
      })
    }
  }

  componentDidMount () {
    const {currencyCode} = this.props
    const abcWallet: AbcCurrencyWallet | null = this.props.abcWallet
    if (!abcWallet || this.props.loading) return

    WALLET_API.getReceiveAddress(abcWallet, currencyCode)
    .then((receiveAddress) => {
      const {publicAddress} = receiveAddress
      const abcEncodeUri: AbcEncodeUri = {publicAddress}
      const encodedURI = this.props.abcWallet ? this.props.abcWallet.encodeUri(abcEncodeUri) : ''
      this.setState({
        encodedURI,
        publicAddress
      })
    })
    .catch((e) => {
      this.setState({encodedURI: '', publicAddress: ''})
      console.log(e)
    })
  }

  onExchangeAmountChanged = (amounts: ExchangedFlipInputAmounts) => {
    const parsedURI: AbcEncodeUri = {
      publicAddress: this.state.publicAddress
    }
    if (bns.gt(amounts.nativeAmount, '0')) {
      parsedURI.nativeAmount = amounts.nativeAmount
    }
    const encodedURI = this.props.abcWallet ? this.props.abcWallet.encodeUri(parsedURI) : ''

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
      primaryCurrencyInfo,
      secondaryCurrencyInfo,
      exchangeSecondaryToPrimaryRatio
    } = this.props
    return (
      <SafeAreaView>
        <Gradient style={styles.view}>
          <Gradient style={styles.gradient} />

          <View style={styles.exchangeRateContainer}>
            <ExchangedExchangeRate
              primaryCurrencyInfo={primaryCurrencyInfo}
              secondaryCurrencyInfo={secondaryCurrencyInfo}
              exchangeSecondaryToPrimaryRatio={exchangeSecondaryToPrimaryRatio} />
          </View>

          <View style={styles.main}>
            <ExchangedFlipInput
              primaryCurrencyInfo={primaryCurrencyInfo}
              secondaryCurrencyInfo={secondaryCurrencyInfo}
              exchangeSecondaryToPrimaryRatio={exchangeSecondaryToPrimaryRatio}
              overridePrimaryExchangeAmount={''}
              forceUpdateGuiCounter={0}
              onExchangeAmountChanged={this.onExchangeAmountChanged}
              keyboardVisible={false}
              color={color} />

            <QRCode value={this.state.encodedURI} />
            <RequestStatus requestAddress={this.state.publicAddress} amountRequestedInCrypto={0} amountReceivedInCrypto={0} />
          </View>

          <View style={styles.shareButtonsContainer}>
            <ShareButtons styles={styles.shareButtons} shareViaEmail={this.shareViaEmail} shareViaSMS={this.shareViaSMS} shareViaShare={this.shareViaShare} copyToClipboard={this.copyToClipboard} />
          </View>
          {this.renderDropUp()}
        </Gradient>
      </SafeAreaView>
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
      title: sprintf(s.strings.request_qr_email_title, APP_NAME)
    }, {dialogTitle: 'Share Edge Request'})
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
    .catch((e) => {
      console.log(e)
    })
  }

  shareViaSMS = () => {
    ContactsWrapper.getContact().then(() => {
      this.shareMessage()
      // console.log('shareViaSMS')
    })
    .catch((e) => {
      console.log(e)
    })
  }

  shareViaShare = () => {
    this.shareMessage()
    // console.log('shareViaShare')
  }
}
