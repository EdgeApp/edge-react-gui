// @flow

import { bns } from 'biggystring'
import { createSimpleConfirmModal, showModal } from 'edge-components'
import type { EdgeCurrencyWallet, EdgeEncodeUri } from 'edge-core-js'
import React, { Component } from 'react'
import { ActivityIndicator, Alert, Clipboard, Platform, View } from 'react-native'
import ContactsWrapper from 'react-native-contacts-wrapper'
import RNFS from 'react-native-fs'
import Share from 'react-native-share'
import slowlog from 'react-native-slowlog'
import { sprintf } from 'sprintf-js'

import * as Constants from '../../constants/indexConstants'
import s from '../../locales/strings.js'
import ExchangeRate from '../../modules/UI/components/ExchangeRate/index.js'
import { ExchangedFlipInput } from '../../modules/UI/components/FlipInput/ExchangedFlipInput2.js'
import type { ExchangedFlipInputAmounts } from '../../modules/UI/components/FlipInput/ExchangedFlipInput2.js'
import Gradient from '../../modules/UI/components/Gradient/Gradient.ui'
import { Icon } from '../../modules/UI/components/Icon/Icon.ui.js'
import QRCode from '../../modules/UI/components/QRCode/index.js'
import RequestStatus from '../../modules/UI/components/RequestStatus/index.js'
import SafeAreaView from '../../modules/UI/components/SafeAreaView/index.js'
import ShareButtons from '../../modules/UI/components/ShareButtons/index.js'
import WalletListModal from '../../modules/UI/components/WalletListModal/WalletListModalConnector'
import styles from '../../styles/scenes/RequestStyle.js'
import type { GuiCurrencyInfo, GuiWallet } from '../../types.js'
import { getObjectDiff } from '../../util/utils'

const PUBLIC_ADDRESS_REFRESH_MS = 2000

export type RequestStateProps = {
  currencyCode: string,
  edgeWallet: EdgeCurrencyWallet,
  exchangeSecondaryToPrimaryRatio: number,
  guiWallet: GuiWallet,
  loading: false,
  primaryCurrencyInfo: GuiCurrencyInfo,
  publicAddress: string,
  segwitAddress: string,
  legacyAddress: string,
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
  publicAddress: string,
  segwitAddress: string,
  legacyAddress: string,
  secondaryCurrencyInfo: null,
  showToWalletModal: null,
  useLegacyAddress: null
}

export type RequestDispatchProps = {
  refreshReceiveAddressRequest(string): void,
  onSelectWallet: (string, string) => void
}
type ModalState = 'NOT_YET_SHOWN' | 'VISIBLE' | 'SHOWN'
type CurrencyMinimumPopupState = { [currencyCode: string]: ModalState }

export type LoadingProps = RequestLoadingProps & RequestDispatchProps
export type LoadedProps = RequestStateProps & RequestDispatchProps
export type Props = LoadingProps | LoadedProps
export type State = {
  publicAddress: string,
  legacyAddress: string,
  segwitAddress: string,
  encodedURI: string,
  minimumPopupModalState: CurrencyMinimumPopupState
}

export class Request extends Component<Props, State> {
  constructor (props: Props) {
    super(props)
    const minimumPopupModalState: CurrencyMinimumPopupState = {}
    Object.keys(Constants.SPECIAL_CURRENCY_INFO).forEach(currencyCode => {
      if (Constants.getSpecialCurrencyInfo(currencyCode).minimumPopupModals) {
        minimumPopupModalState[currencyCode] = 'NOT_YET_SHOWN'
      }
    })
    this.state = {
      publicAddress: props.publicAddress,
      legacyAddress: props.legacyAddress,
      segwitAddress: props.segwitAddress,
      encodedURI: '',
      minimumPopupModalState
    }
    if (this.shouldShowMinimumModal(props)) {
      if (!props.currencyCode) return
      this.state.minimumPopupModalState[props.currencyCode] = 'VISIBLE'
      console.log('stop, in constructor')
      this.enqueueMinimumAmountModal()
    }
    slowlog(this, /.*/, global.slowlogOptions)
  }

  componentDidMount () {
    try {
      this.generateEncodedUri()
    } catch (e) {
      console.log('error generating encodedURI: ', e)
    }
  }

  onCloseXRPMinimumModal = () => {
    const minimumPopupModalState: CurrencyMinimumPopupState = Object.assign({}, this.state.minimumPopupModalState)
    if (!this.props.currencyCode) return
    minimumPopupModalState[this.props.currencyCode] = 'SHOWN'
    this.setState({ minimumPopupModalState })
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

  async generateEncodedUri () {
    const { edgeWallet, useLegacyAddress } = this.props
    let publicAddress = this.props.publicAddress
    let legacyAddress = this.props.legacyAddress
    let segwitAddress = this.props.segwitAddress
    const abcEncodeUri = segwitAddress ? { segwitAddress, publicAddress } : useLegacyAddress ? { publicAddress, legacyAddress } : { publicAddress }
    let encodedURI = s.strings.loading
    try {
      encodedURI = edgeWallet ? await edgeWallet.encodeUri(abcEncodeUri) : s.strings.loading
      this.setState({
        encodedURI
      })
    } catch (e) {
      console.log(e)
      publicAddress = s.strings.loading
      legacyAddress = s.strings.loading
      segwitAddress = s.strings.loading
      this.setState({
        publicAddress,
        legacyAddress,
        segwitAddress
      })
      setTimeout(() => {
        if (edgeWallet && edgeWallet.id) {
          this.props.refreshReceiveAddressRequest(edgeWallet.id)
        }
      }, PUBLIC_ADDRESS_REFRESH_MS)
    }
  }

  async UNSAFE_componentWillReceiveProps (nextProps: Props) {
    if (nextProps.loading) return

    const didAddressChange = this.state.publicAddress !== nextProps.guiWallet.receiveAddress.publicAddress
    const changeLegacyPublic = nextProps.useLegacyAddress !== this.props.useLegacyAddress
    const didWalletChange = this.props.edgeWallet && nextProps.edgeWallet.id !== this.props.edgeWallet.id

    if (didAddressChange || changeLegacyPublic || didWalletChange) {
      let publicAddress = nextProps.guiWallet.receiveAddress.publicAddress
      let segwitAddress = nextProps.guiWallet.receiveAddress.segwitAddress
      let legacyAddress = nextProps.guiWallet.receiveAddress.legacyAddress

      const abcEncodeUri = nextProps.useLegacyAddress ? { publicAddress, legacyAddress } : { publicAddress }

      let encodedURI = s.strings.loading
      try {
        encodedURI = nextProps.edgeWallet ? await nextProps.edgeWallet.encodeUri(abcEncodeUri) : s.strings.loading
      } catch (e) {
        console.log(e)
        publicAddress = s.strings.loading
        segwitAddress = s.strings.loading
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
        segwitAddress: segwitAddress,
        legacyAddress: legacyAddress
      })
    }
    // old blank address to new
    // include 'didAddressChange' because didWalletChange returns false upon initial request scene load
    if (didWalletChange || didAddressChange) {
      if (this.shouldShowMinimumModal(nextProps)) {
        const minimumPopupModalState: CurrencyMinimumPopupState = Object.assign({}, this.state.minimumPopupModalState)
        if (minimumPopupModalState[nextProps.currencyCode] === 'NOT_YET_SHOWN') {
          this.enqueueMinimumAmountModal()
        }
        minimumPopupModalState[nextProps.currencyCode] = 'VISIBLE'
        this.setState({ minimumPopupModalState })
      }
    }
  }

  enqueueMinimumAmountModal = async () => {
    let message = ''
    if (this.props.currencyCode && Constants.getSpecialCurrencyInfo(this.props.currencyCode).minimumPopupModals) {
      message = Constants.getSpecialCurrencyInfo(this.props.currencyCode).minimumPopupModals.modalMessage
    } else {
      return
    }
    const modal = createSimpleConfirmModal({
      title: s.strings.request_minimum_notification_title,
      message,
      icon: <Icon type={Constants.MATERIAL_COMMUNITY} name={Constants.EXCLAMATION} size={30} />,
      buttonText: s.strings.string_ok
    })

    await showModal(modal)
    // resolve value doesn't really matter here
    this.onCloseXRPMinimumModal()
  }

  render () {
    if (this.props.loading) {
      return <ActivityIndicator style={{ flex: 1, alignSelf: 'center' }} size={'large'} />
    }

    const color = 'white'
    const { primaryCurrencyInfo, secondaryCurrencyInfo, exchangeSecondaryToPrimaryRatio, onSelectWallet } = this.props
    const requestAddress = this.props.useLegacyAddress
      ? this.state.legacyAddress
      : this.state.segwitAddress
        ? this.state.segwitAddress
        : this.state.publicAddress

    return (
      <SafeAreaView>
        <Gradient style={styles.view}>
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
    const { segwitAddress, publicAddress, legacyAddress } = this.state
    const edgeEncodeUri: EdgeEncodeUri =
      this.props.useLegacyAddress && legacyAddress ? { publicAddress, legacyAddress } : segwitAddress ? { segwitAddress, publicAddress } : { publicAddress }
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
    const requestAddress = this.props.useLegacyAddress
      ? this.state.legacyAddress
      : this.state.segwitAddress
        ? this.state.segwitAddress
        : this.state.publicAddress
    Clipboard.setString(requestAddress)
    Alert.alert(s.strings.fragment_request_address_copied)
  }

  shouldShowMinimumModal = (props: Props): boolean => {
    if (!props.currencyCode) return false
    if (this.state.minimumPopupModalState[props.currencyCode]) {
      if (this.state.minimumPopupModalState[props.currencyCode] === 'NOT_YET_SHOWN') {
        let minBalance = '0'
        if (Constants.getSpecialCurrencyInfo(props.currencyCode).minimumPopupModals) {
          minBalance = Constants.getSpecialCurrencyInfo(props.currencyCode).minimumPopupModals.minimumNativeBalance
        }
        if (bns.lt(props.guiWallet.primaryNativeBalance, minBalance)) {
          return true
        }
      }
    }
    return false
  }

  shareMessage = () => {
    const title = sprintf(s.strings.request_qr_email_title, s.strings.app_name, this.props.currencyCode)
    const message = sprintf(s.strings.request_qr_email_title, s.strings.app_name, this.props.currencyCode) + ': ' + this.state.encodedURI
    const path = Platform.OS === Constants.IOS ? RNFS.DocumentDirectoryPath + '/' + title + '.txt' : RNFS.ExternalDirectoryPath + '/' + title + '.txt'
    RNFS.writeFile(path, message, 'utf8')
      .then(success => {
        const url = Platform.OS === Constants.IOS ? 'file://' + path : ''
        const shareOptions = {
          url,
          title,
          message,
          subject: sprintf(s.strings.request_qr_email_title, s.strings.app_name, this.props.currencyCode) //  for email,
        }
        Share.open(shareOptions).catch(e => console.log(e))
      })
      .catch(err => {
        console.log(err.message)
      })
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
