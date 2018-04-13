// @flow

import { bns } from 'biggystring'
import type { EdgeCurrencyWallet, EdgeEncodeUri } from 'edge-core-js'
import React, { Component } from 'react'
import { ActivityIndicator, Alert, Clipboard, Share, View } from 'react-native'
import ContactsWrapper from 'react-native-contacts-wrapper'
import { sprintf } from 'sprintf-js'

import * as Constants from '../../../../constants/indexConstants'
import s from '../../../../locales/strings.js'
import type { GuiCurrencyInfo, GuiReceiveAddress, GuiTransactionRequest, GuiWallet } from '../../../../types.js'
import WalletListModal from '../../../UI/components/WalletListModal/WalletListModalConnector'
import ExchangedExchangeRate from '../../components/ExchangeRate/ExchangedExchangeRate.ui.js'
import { ExchangedFlipInput } from '../../components/FlipInput/ExchangedFlipInput2.js'
import type { ExchangedFlipInputAmounts } from '../../components/FlipInput/ExchangedFlipInput2.js'
import Gradient from '../../components/Gradient/Gradient.ui'
import QRCode from '../../components/QRCode/index.js'
import RequestStatus from '../../components/RequestStatus/index.js'
import SafeAreaView from '../../components/SafeAreaView/index.js'
import ShareButtons from '../../components/ShareButtons/index.js'
import styles from './styles.js'

export type RequestStateProps = {
  currencyCode: string,
  edgeWallet: EdgeCurrencyWallet,
  exchangeSecondaryToPrimaryRatio: number,
  guiWallet: GuiWallet,
  loading: false,
  primaryCurrencyInfo: GuiCurrencyInfo,
  request: GuiTransactionRequest,
  secondaryCurrencyInfo: GuiCurrencyInfo,
  showToWalletModal: boolean,
  useLegacyAddress: boolean
}
export type RequestLoadingProps = {
  edgeWallet: null,
  currencyCode: null,
  exchangeSecondaryToPrimaryRatio: null,
  guiWallet: null,
  loading: true,
  primaryCurrencyInfo: null,
  request: Object,
  secondaryCurrencyInfo: null,
  showToWalletModal: null,
  useLegacyAddress: null
}

export type RequestDispatchProps = {
  saveReceiveAddress(GuiReceiveAddress): void
}

export type LoadingProps = RequestLoadingProps & RequestDispatchProps
export type LoadedProps = RequestStateProps & RequestDispatchProps
export type Props = LoadingProps | LoadedProps
export type State = {
  publicAddress: string,
  legacyAddress: string,
  encodedURI: string,
  result: string
}

export class Request extends Component<Props, State> {
  constructor (props: Props) {
    super(props)
    this.state = {
      publicAddress: '',
      legacyAddress: '',
      encodedURI: '',
      result: ''
    }
  }

  componentWillReceiveProps (nextProps: Props) {
    if (nextProps.loading) return

    const didAddressChange = this.state.publicAddress !== nextProps.guiWallet.receiveAddress.publicAddress
    const changeLegacyPublic = nextProps.useLegacyAddress !== this.props.useLegacyAddress
    const didWalletChange = this.props.edgeWallet && nextProps.edgeWallet.id !== this.props.edgeWallet.id

    if (didAddressChange || changeLegacyPublic || didWalletChange) {
      const publicAddress = nextProps.guiWallet.receiveAddress.publicAddress
      const legacyAddress = nextProps.guiWallet.receiveAddress.legacyAddress

      const abcEncodeUri = nextProps.useLegacyAddress
        ? { publicAddress, legacyAddress }
        : { publicAddress }

      const encodedURI = nextProps.edgeWallet ? nextProps.edgeWallet.encodeUri(abcEncodeUri) : ''

      this.setState({
        encodedURI,
        publicAddress: publicAddress,
        legacyAddress: legacyAddress
      })
    }
  }

  onExchangeAmountChanged = (amounts: ExchangedFlipInputAmounts) => {
    const { publicAddress, legacyAddress } = this.state
    const edgeEncodeUri: EdgeEncodeUri = this.props.useLegacyAddress && legacyAddress ? { publicAddress, legacyAddress } : { publicAddress }
    if (bns.gt(amounts.nativeAmount, '0')) {
      edgeEncodeUri.nativeAmount = amounts.nativeAmount
    }
    const encodedURI = this.props.edgeWallet ? this.props.edgeWallet.encodeUri(edgeEncodeUri) : ''

    this.setState({ encodedURI })
  }

  render () {
    if (this.props.loading) {
      return <ActivityIndicator style={{ flex: 1, alignSelf: 'center' }} size={'large'} />
    }

    const color = 'white'
    const {
      primaryCurrencyInfo,
      secondaryCurrencyInfo,
      exchangeSecondaryToPrimaryRatio
    } = this.props
    const requestAddress = this.props.useLegacyAddress
      ? this.state.legacyAddress
      : this.state.publicAddress

    return (
      <SafeAreaView>
        <Gradient style={styles.view}>
          <Gradient style={styles.gradient} />

          <View style={styles.exchangeRateContainer}>
            <ExchangedExchangeRate
              primaryCurrencyInfo={primaryCurrencyInfo}
              secondaryCurrencyInfo={secondaryCurrencyInfo}
              exchangeSecondaryToPrimaryRatio={exchangeSecondaryToPrimaryRatio}
            />
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
              color={color}
            />

            <QRCode value={this.state.encodedURI} />
            <RequestStatus requestAddress={requestAddress} amountRequestedInCrypto={0} amountReceivedInCrypto={0} />
          </View>

          <View style={styles.shareButtonsContainer}>
            <ShareButtons
              styles={styles.shareButtons}
              shareViaEmail={this.shareViaEmail}
              shareViaSMS={this.shareViaSMS}
              shareViaShare={this.shareViaShare}
              copyToClipboard={this.copyToClipboard}
            />
          </View>

          {this.props.showToWalletModal &&
          <WalletListModal topDisplacement={Constants.REQUEST_WALLET_DIALOG_TOP} type={Constants.TO} />}
        </Gradient>
      </SafeAreaView>
    )
  }

  onExchangeAmountChanged = (amounts: ExchangedFlipInputAmounts) => {
    const { publicAddress, legacyAddress } = this.state
    const edgeEncodeUri: EdgeEncodeUri = this.props.useLegacyAddress && legacyAddress ? { publicAddress, legacyAddress } : { publicAddress }
    if (bns.gt(amounts.nativeAmount, '0')) {
      edgeEncodeUri.nativeAmount = amounts.nativeAmount
    }
    const encodedURI = this.props.edgeWallet ? this.props.edgeWallet.encodeUri(edgeEncodeUri) : ''

    this.setState({
      encodedURI
    })
  }

  copyToClipboard = () => {
    const requestAddress = this.props.useLegacyAddress ? this.state.legacyAddress : this.state.publicAddress
    Clipboard.setString(requestAddress)
    Alert.alert(s.strings.fragment_request_address_copied)
  }

  showResult = (result: { activityType: string }) => {
    if (result.action === Share.sharedAction) {
      this.props.saveReceiveAddress(this.props.request.receiveAddress)

      if (result.activityType) {
        this.setState({
          result: 'shared with an activityType: ' + result.activityType
        })
      } else {
        this.setState({ result: 'shared' })
      }
    } else if (result.action === Share.dismissedAction) {
      this.setState({ result: 'dismissed' })
    }
  }

  shareMessage = () => {
    Share.share(
      {
        message: this.state.encodedURI,
        title: sprintf(s.strings.request_qr_email_title, s.strings.app_name)
      },
      { dialogTitle: s.strings.request_share_edge_request }
    )
      .then(this.showResult)
      .catch(error =>
        this.setState({
          result: 'error: ' + error.message
        })
      )
  }

  shareViaEmail = () => {
    ContactsWrapper.getContact()
      .then(() => {
        this.shareMessage()
        // console.log('shareViaEmail')
      })
      .catch(e => {
        console.log(e)
      })
  }

  shareViaSMS = () => {
    ContactsWrapper.getContact()
      .then(() => {
        this.shareMessage()
        // console.log('shareViaSMS')
      })
      .catch(e => {
        console.log(e)
      })
  }

  shareViaShare = () => {
    this.shareMessage()
    // console.log('shareViaShare')
  }
}
