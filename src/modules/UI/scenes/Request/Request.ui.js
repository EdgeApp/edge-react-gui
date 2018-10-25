// @flow

import { bns } from 'biggystring'
import { createSimpleConfirmModal, showModal } from 'edge-components'
import type { EdgeCurrencyWallet, EdgeEncodeUri } from 'edge-core-js'
import React, { Component } from 'react'
import { ActivityIndicator, Alert, Clipboard, View } from 'react-native'
import ContactsWrapper from 'react-native-contacts-wrapper'
import Share from 'react-native-share'
import slowlog from 'react-native-slowlog'
import { sprintf } from 'sprintf-js'

import * as Constants from '../../../../constants/indexConstants'
import s from '../../../../locales/strings.js'
import type { GuiCurrencyInfo, GuiWallet } from '../../../../types.js'
import WalletListModal from '../../../UI/components/WalletListModal/WalletListModalConnector'
import { getObjectDiff } from '../../../utils'
import ExchangeRate from '../../components/ExchangeRate/index.js'
import { ExchangedFlipInput } from '../../components/FlipInput/ExchangedFlipInput2.js'
import type { ExchangedFlipInputAmounts } from '../../components/FlipInput/ExchangedFlipInput2.js'
import Gradient from '../../components/Gradient/Gradient.ui'
import { Icon } from '../../components/Icon/Icon.ui.js'
import QRCode from '../../components/QRCode/index.js'
import RequestStatus from '../../components/RequestStatus/index.js'
import SafeAreaView from '../../components/SafeAreaView/index.js'
import ShareButtons from '../../components/ShareButtons/index.js'
import styles from './styles.js'

const PUBLIC_ADDRESS_REFRESH_MS = 2000

export type RequestStateProps = {
  currencyCode: string,
  edgeWallet: EdgeCurrencyWallet,
  exchangeSecondaryToPrimaryRatio: number,
  guiWallet: GuiWallet,
  loading: false,
  primaryCurrencyInfo: GuiCurrencyInfo,
  publicAddress: string,
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
type ModalConfig = {
  modalState: ModalState,
  minimumNativeBalance: string,
  modalMessage: string
}
type CurrencyMinimumPopupState = { [currencyCode: string]: ModalConfig }

export type LoadingProps = RequestLoadingProps & RequestDispatchProps
export type LoadedProps = RequestStateProps & RequestDispatchProps
export type Props = LoadingProps | LoadedProps
export type State = {
  publicAddress: string,
  legacyAddress: string,
  encodedURI: string,
  minimumPopupModals: CurrencyMinimumPopupState
}

export class Request extends Component<Props, State> {
  constructor (props: Props) {
    super(props)
    const minimumPopupModals: CurrencyMinimumPopupState = {
      XRP: {
        modalState: 'NOT_YET_SHOWN',
        minimumNativeBalance: '20000000',
        modalMessage: s.strings.request_xrp_minimum_notification_body
      },
      XLM: {
        modalState: 'NOT_YET_SHOWN',
        minimumNativeBalance: '10000000',
        modalMessage: s.strings.request_xlm_minimum_notification_body
      }
    }
    this.state = {
      publicAddress: props.publicAddress,
      legacyAddress: props.legacyAddress,
      encodedURI: '',
      minimumPopupModals
    }
    if (this.shouldShowMinimumModal(props)) {
      if (!props.currencyCode) return
      this.state.minimumPopupModals[props.currencyCode].modalState = 'VISIBLE'
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
    const minimumPopupModals: CurrencyMinimumPopupState = Object.assign({}, this.state.minimumPopupModals)
    if (!this.props.currencyCode) return
    minimumPopupModals[this.props.currencyCode].modalState = 'SHOWN'
    this.setState({ minimumPopupModals })
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
    const abcEncodeUri = useLegacyAddress ? { publicAddress, legacyAddress } : { publicAddress }
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
      this.setState({
        publicAddress,
        legacyAddress
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
    // include 'didAddressChange' because didWalletChange returns false upon initial request scene load
    if (didWalletChange || didAddressChange) {
      if (this.shouldShowMinimumModal(nextProps)) {
        const minimumPopupModals: CurrencyMinimumPopupState = Object.assign({}, this.state.minimumPopupModals)
        if (minimumPopupModals[nextProps.currencyCode].modalState === 'NOT_YET_SHOWN') {
          this.enqueueMinimumAmountModal()
        }
        minimumPopupModals[nextProps.currencyCode].modalState = 'VISIBLE'
        this.setState({ minimumPopupModals })
      }
    }
  }

  enqueueMinimumAmountModal = async () => {
    if (!this.props.currencyCode) return
    const modal = createSimpleConfirmModal({
      title: s.strings.request_minimum_notification_title,
      message: this.state.minimumPopupModals[this.props.currencyCode].modalMessage,
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
    const requestAddress = this.props.useLegacyAddress ? this.state.legacyAddress : this.state.publicAddress

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

  shouldShowMinimumModal = (props: Props): boolean => {
    if (!props.currencyCode) return false
    if (this.state.minimumPopupModals[props.currencyCode]) {
      if (this.state.minimumPopupModals[props.currencyCode].modalState === 'NOT_YET_SHOWN') {
        const minBalance = this.state.minimumPopupModals[props.currencyCode].minimumNativeBalance
        if (bns.lt(props.guiWallet.primaryNativeBalance, minBalance)) {
          return true
        }
      }
    }
    return false
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
