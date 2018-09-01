// @flow

import { bns } from 'biggystring'
import type { EdgeCurrencyWallet, EdgeEncodeUri } from 'edge-core-js'
import React, { Component } from 'react'
import { ActivityIndicator, Alert, Clipboard, View } from 'react-native'
import ContactsWrapper from 'react-native-contacts-wrapper'
import Share from 'react-native-share'
import slowlog from 'react-native-slowlog'
import { sprintf } from 'sprintf-js'

import * as Constants from '../../../../constants/indexConstants'
import s from '../../../../locales/strings.js'
import type { GuiCurrencyInfo, GuiReceiveAddress, GuiWallet } from '../../../../types.js'
import WalletListModal from '../../../UI/components/WalletListModal/WalletListModalConnector'
import { getObjectDiff } from '../../../utils'
import ExchangeRate from '../../components/ExchangeRate/index.js'
import { ExchangedFlipInput } from '../../components/FlipInput/ExchangedFlipInput2.js'
import type { ExchangedFlipInputAmounts } from '../../components/FlipInput/ExchangedFlipInput2.js'
import Gradient from '../../components/Gradient/Gradient.ui'
import QRCode from '../../components/QRCode/index.js'
import RequestStatus from '../../components/RequestStatus/index.js'
import SafeAreaView from '../../components/SafeAreaView/index.js'
import ShareButtons from '../../components/ShareButtons/index.js'
import XRPMinimumModal from './components/XRPMinimumModal/XRPMinimumModal.ui.js'
import styles from './styles.js'

const PUBLIC_ADDRESS_REFRESH_MS = 2000

export type RequestStateProps = {
  currencyCode: string,
  edgeWallet: EdgeCurrencyWallet,
  exchangeSecondaryToPrimaryRatio: number,
  guiWallet: GuiWallet,
  loading: false,
  primaryCurrencyInfo: GuiCurrencyInfo,
  receiveAddress: GuiReceiveAddress,
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
  receiveAddress: null,
  secondaryCurrencyInfo: null,
  showToWalletModal: null,
  useLegacyAddress: null
}

export type RequestDispatchProps = {
  refreshReceiveAddressRequest(string): void,
  onSelectWallet: (string, string) => void
}

export type LoadingProps = RequestLoadingProps & RequestDispatchProps
export type LoadedProps = RequestStateProps & RequestDispatchProps
export type Props = LoadingProps | LoadedProps
export type State = {
  publicAddress: string,
  legacyAddress: string,
  encodedURI: string,
  isXRPMinimumModalVisible: boolean,
  hasXRPMinimumModalAlreadyShown: boolean
}

export class Request extends Component<Props, State> {
  constructor (props: Props) {
    super(props)
    this.state = {
      publicAddress: '',
      legacyAddress: '',
      encodedURI: '',
      isXRPMinimumModalVisible: false,
      hasXRPMinimumModalAlreadyShown: false
    }
    slowlog(this, /.*/, global.slowlogOptions)
  }

  onCloseXRPMinimumModal = () => {
    this.setState({
      isXRPMinimumModalVisible: false
    })
  }

  shouldComponentUpdate (nextProps: Props, nextState: State) {
    let diffElement2: string = ''
    const diffElement = getObjectDiff(this.props, nextProps, {
      primaryCurrencyInfo: true,
      secondaryCurrencyInfo: true,
      displayDenomination: true,
      exchangeDenomination: true
    })
    if (!diffElement) {
      diffElement2 = getObjectDiff(this.state, nextState)
    }
    return !!diffElement || !!diffElement2
  }

  async UNSAFE_componentWillReceiveProps (nextProps: Props) {
    if (nextProps.loading) return

    const didAddressChange = this.state.publicAddress !== nextProps.guiWallet.receiveAddress.publicAddress
    const changeLegacyPublic = nextProps.useLegacyAddress !== this.props.useLegacyAddress
    const didWalletChange = this.props.edgeWallet && nextProps.edgeWallet.id !== this.props.edgeWallet.id

    if (didAddressChange || changeLegacyPublic || didWalletChange) {
      let publicAddress = nextProps.guiWallet.receiveAddress.publicAddress
      let legacyAddress = nextProps.guiWallet.receiveAddress.legacyAddress

      const abcEncodeUri = nextProps.useLegacyAddress ? { publicAddress, legacyAddress } : { publicAddress }

      let encodedURI = s.strings.loading
      try {
        encodedURI = nextProps.edgeWallet ? await nextProps.edgeWallet.encodeUri(abcEncodeUri) : s.strings.loading
      } catch (e) {
        console.log(e)
        publicAddress = s.strings.loading
        legacyAddress = s.strings.loading
        setTimeout(() => {
          if (nextProps.edgeWallet && nextProps.edgeWallet.id) {
            nextProps.refreshReceiveAddressRequest(nextProps.edgeWallet.id)
          }
        }, PUBLIC_ADDRESS_REFRESH_MS)
      }

      this.setState({
        encodedURI,
        publicAddress: publicAddress,
        legacyAddress: legacyAddress
      })
    }
    // old blank address to new
    if (didWalletChange) {
      if (nextProps.currencyCode === 'XRP') {
        if (!this.state.hasXRPMinimumModalAlreadyShown) {
          if (bns.lt(nextProps.guiWallet.primaryNativeBalance, '20000000')) {
            this.setState({
              isXRPMinimumModalVisible: true,
              hasXRPMinimumModalAlreadyShown: true
            })
          }
        }
      }
    }
  }

  render () {
    if (this.props.loading) {
      return <ActivityIndicator style={{ flex: 1, alignSelf: 'center' }} size={'large'} />
    }

    const color = 'white'
    const { primaryCurrencyInfo, secondaryCurrencyInfo, exchangeSecondaryToPrimaryRatio, onSelectWallet } = this.props
    const requestAddress = this.props.useLegacyAddress ? this.state.legacyAddress : this.state.publicAddress

    return (
      <SafeAreaView>
        <Gradient style={styles.view}>
          <XRPMinimumModal visibilityBoolean={this.state.isXRPMinimumModalVisible} onExit={this.onCloseXRPMinimumModal} />
          <Gradient style={styles.gradient} />

          <View style={styles.exchangeRateContainer}>
            <ExchangeRate primaryInfo={primaryCurrencyInfo} secondaryInfo={secondaryCurrencyInfo} secondaryDisplayAmount={exchangeSecondaryToPrimaryRatio} />
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

          {this.props.showToWalletModal && (
            <WalletListModal topDisplacement={Constants.REQUEST_WALLET_DIALOG_TOP} type={Constants.TO} onSelectWallet={onSelectWallet} />
          )}
        </Gradient>
      </SafeAreaView>
    )
  }

  onExchangeAmountChanged = async (amounts: ExchangedFlipInputAmounts) => {
    const { publicAddress, legacyAddress } = this.state
    const edgeEncodeUri: EdgeEncodeUri = this.props.useLegacyAddress && legacyAddress ? { publicAddress, legacyAddress } : { publicAddress }
    if (bns.gt(amounts.nativeAmount, '0')) {
      edgeEncodeUri.nativeAmount = amounts.nativeAmount
    }
    let encodedURI = s.strings.loading
    try {
      encodedURI = this.props.edgeWallet ? await this.props.edgeWallet.encodeUri(edgeEncodeUri) : s.strings.loading
    } catch (e) {
      console.log(e)
      setTimeout(() => {
        if (this.props.edgeWallet && this.props.edgeWallet.id) {
          this.props.refreshReceiveAddressRequest(this.props.edgeWallet.id)
        }
      }, PUBLIC_ADDRESS_REFRESH_MS)
    }

    this.setState({ encodedURI })
  }

  copyToClipboard = () => {
    const requestAddress = this.props.useLegacyAddress ? this.state.legacyAddress : this.state.publicAddress
    Clipboard.setString(requestAddress)
    Alert.alert(s.strings.fragment_request_address_copied)
  }

  shareMessage = () => {
    const shareOptions = {
      url: '',
      title: sprintf(s.strings.request_qr_email_title, s.strings.app_name, this.props.currencyCode),
      message: sprintf(s.strings.request_qr_email_title, s.strings.app_name, this.props.currencyCode) + ': ' + this.state.encodedURI,
      subject: sprintf(s.strings.request_qr_email_title, s.strings.app_name, this.props.currencyCode) //  for email
    }

    Share.open(shareOptions).catch(e => console.log(e))
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
