// @flow

import { bns } from 'biggystring'
import { createSimpleConfirmModal } from 'edge-components'
import type { EdgeCurrencyConfig, EdgeCurrencyInfo, EdgeCurrencyWallet, EdgeEncodeUri } from 'edge-core-js'
import React, { Component } from 'react'
import { ActivityIndicator, Clipboard, Dimensions, Platform, View } from 'react-native'
import ContactsWrapper from 'react-native-contacts-wrapper'
import RNFS from 'react-native-fs'
import { Actions } from 'react-native-router-flux'
import Share from 'react-native-share'
import slowlog from 'react-native-slowlog'
import { sprintf } from 'sprintf-js'

import * as Constants from '../../constants/indexConstants'
import s from '../../locales/strings.js'
import ExchangeRate from '../../modules/UI/components/ExchangeRate/index.js'
import type { ExchangedFlipInputAmounts } from '../../modules/UI/components/FlipInput/ExchangedFlipInput2.js'
import { ExchangedFlipInput } from '../../modules/UI/components/FlipInput/ExchangedFlipInput2.js'
import { Icon } from '../../modules/UI/components/Icon/Icon.ui.js'
import RequestStatus from '../../modules/UI/components/RequestStatus/index.js'
import ShareButtons from '../../modules/UI/components/ShareButtons/index.js'
import { styles } from '../../styles/scenes/RequestStyle.js'
import { THEME } from '../../theme/variables/airbitz.js'
import type { GuiCurrencyInfo, GuiWallet } from '../../types/types.js'
import { getObjectDiff } from '../../util/utils'
import { launchModal } from '../common/ModalProvider.js'
import { QrCode } from '../common/QrCode.js'
import { SceneWrapper } from '../common/SceneWrapper.js'
import { createFioAddressModal } from '../modals/RequestFioAddressModal'
import { showError, showToast } from '../services/AirshipInstance.js'

const PUBLIC_ADDRESS_REFRESH_MS = 2000

export type RequestStateProps = {
  currencyCode: string,
  currencyInfo: EdgeCurrencyInfo | null,
  edgeWallet: EdgeCurrencyWallet,
  exchangeSecondaryToPrimaryRatio: number,
  guiWallet: GuiWallet,
  loading: false,
  primaryCurrencyInfo: GuiCurrencyInfo,
  publicAddress: string,
  legacyAddress: string,
  secondaryCurrencyInfo: GuiCurrencyInfo,
  useLegacyAddress: boolean,
  fioPlugin: EdgeCurrencyConfig,
  fioAddressesExist: boolean,
  isConnected: boolean
}
export type RequestLoadingProps = {
  edgeWallet: null,
  currencyCode: null,
  currencyInfo: null,
  exchangeSecondaryToPrimaryRatio: null,
  guiWallet: null,
  loading: true,
  primaryCurrencyInfo: null,
  publicAddress: string,
  legacyAddress: string,
  secondaryCurrencyInfo: null,
  useLegacyAddress: null,
  fioPlugin: EdgeCurrencyConfig,
  fioAddressesExist: boolean,
  isConnected: boolean
}

export type RequestDispatchProps = {
  refreshReceiveAddressRequest(string): void,
  refreshAllFioAddresses: () => Promise<void>
}
type ModalState = 'NOT_YET_SHOWN' | 'VISIBLE' | 'SHOWN'
type CurrencyMinimumPopupState = { [currencyCode: string]: ModalState }

export type LoadingProps = RequestLoadingProps & RequestDispatchProps
export type LoadedProps = RequestStateProps & RequestDispatchProps
export type Props = LoadingProps | LoadedProps
export type State = {
  publicAddress: string,
  legacyAddress: string,
  encodedURI: string,
  minimumPopupModalState: CurrencyMinimumPopupState
}

export class Request extends Component<Props, State> {
  amounts: ExchangedFlipInputAmounts

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
    this.generateEncodedUri()
    this.props.refreshAllFioAddresses()
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
    const { edgeWallet, useLegacyAddress, currencyCode } = this.props
    if (!currencyCode) return
    let publicAddress = this.props.publicAddress
    let legacyAddress = this.props.legacyAddress
    const abcEncodeUri = useLegacyAddress ? { publicAddress, legacyAddress, currencyCode } : { publicAddress, currencyCode }
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
    const { currencyCode } = nextProps
    if (nextProps.loading || currencyCode === null) return

    const didAddressChange = this.state.publicAddress !== nextProps.guiWallet.receiveAddress.publicAddress
    const changeLegacyPublic = nextProps.useLegacyAddress !== this.props.useLegacyAddress
    const didWalletChange = this.props.edgeWallet && nextProps.edgeWallet.id !== this.props.edgeWallet.id

    if (didAddressChange || changeLegacyPublic || didWalletChange) {
      let publicAddress = nextProps.guiWallet.receiveAddress.publicAddress
      let legacyAddress = nextProps.guiWallet.receiveAddress.legacyAddress

      const abcEncodeUri = nextProps.useLegacyAddress ? { publicAddress, legacyAddress, currencyCode } : { publicAddress, currencyCode }
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

    await launchModal(modal)
    // resolve value doesn't really matter here
    this.onCloseXRPMinimumModal()
  }

  render () {
    if (this.props.loading) {
      return <ActivityIndicator style={{ flex: 1, alignSelf: 'center' }} size={'large'} />
    }

    const { primaryCurrencyInfo, secondaryCurrencyInfo, exchangeSecondaryToPrimaryRatio, currencyInfo, guiWallet } = this.props
    const addressExplorer = currencyInfo ? currencyInfo.addressExplorer : null
    const requestAddress = this.props.useLegacyAddress ? this.state.legacyAddress : this.state.publicAddress
    const qrSize = Dimensions.get('window').height / 4
    const flipInputHeaderText = guiWallet ? sprintf(s.strings.send_to_wallet, guiWallet.name) : ''
    const flipInputHeaderLogo = guiWallet.symbolImageDarkMono

    return (
      <SceneWrapper hasTabs={false}>
        <View style={styles.exchangeRateContainer}>
          <ExchangeRate primaryInfo={primaryCurrencyInfo} secondaryInfo={secondaryCurrencyInfo} secondaryDisplayAmount={exchangeSecondaryToPrimaryRatio} />
        </View>

        <View style={styles.main}>
          <ExchangedFlipInput
            headerText={flipInputHeaderText}
            headerLogo={flipInputHeaderLogo}
            primaryCurrencyInfo={primaryCurrencyInfo}
            secondaryCurrencyInfo={secondaryCurrencyInfo}
            exchangeSecondaryToPrimaryRatio={exchangeSecondaryToPrimaryRatio}
            overridePrimaryExchangeAmount={''}
            forceUpdateGuiCounter={0}
            onExchangeAmountChanged={this.onExchangeAmountChanged}
            keyboardVisible={false}
            color={THEME.COLORS.WHITE}
            isFiatOnTop={true}
            isFocus={false}
          />

          <View style={styles.qrContainer}>
            <QrCode data={this.state.encodedURI} size={qrSize} />
          </View>
          <RequestStatus requestAddress={requestAddress} addressExplorer={addressExplorer} amountRequestedInCrypto={0} amountReceivedInCrypto={0} />
        </View>

        <View style={styles.shareButtonsContainer}>
          <ShareButtons
            shareViaEmail={this.shareViaEmail}
            shareViaSMS={this.shareViaSMS}
            shareViaShare={this.shareViaShare}
            copyToClipboard={this.copyToClipboard}
            fioAddressModal={this.fioAddressModal}
          />
        </View>
      </SceneWrapper>
    )
  }

  onExchangeAmountChanged = async (amounts: ExchangedFlipInputAmounts) => {
    const { publicAddress, legacyAddress } = this.state
    const { currencyCode } = this.props
    this.amounts = amounts
    if (!currencyCode) return
    const edgeEncodeUri: EdgeEncodeUri =
      this.props.useLegacyAddress && legacyAddress ? { publicAddress, legacyAddress, currencyCode } : { publicAddress, currencyCode }
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
    showToast(s.strings.fragment_request_address_copied)
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
    const { currencyCode, publicAddress } = this.props
    let sharedAddress = this.state.encodedURI
    // if encoded (like XTZ), only share the public address
    if (currencyCode && Constants.getSpecialCurrencyInfo(currencyCode).isUriEncodedStructure) {
      sharedAddress = publicAddress
    }
    const title = sprintf(s.strings.request_qr_email_title, s.strings.app_name, currencyCode)
    const message = sprintf(s.strings.request_qr_email_title, s.strings.app_name, currencyCode) + ': ' + sharedAddress
    const path = Platform.OS === Constants.IOS ? RNFS.DocumentDirectoryPath + '/' + title + '.txt' : RNFS.ExternalDirectoryPath + '/' + title + '.txt'
    RNFS.writeFile(path, message, 'utf8')
      .then(success => {
        const url = Platform.OS === Constants.IOS ? 'file://' + path : ''
        const shareOptions = {
          url,
          title,
          message: sharedAddress
        }
        Share.open(shareOptions).catch(e => console.log(e))
      })
      .catch(showError)
  }

  shareViaEmail = () => {
    ContactsWrapper.getContact()
      .then(() => {
        this.shareMessage()
        // console.log('shareViaEmail')
      })
      .catch(showError)
  }

  shareViaSMS = () => {
    ContactsWrapper.getContact()
      .then(() => {
        this.shareMessage()
        // console.log('shareViaSMS')
      })
      .catch(showError)
  }

  shareViaShare = () => {
    this.shareMessage()
    // console.log('shareViaShare')
  }

  fioAddressModal = async () => {
    if (!this.props.isConnected) {
      showError(s.strings.fio_network_alert_text)
      return
    }
    if (!this.props.fioAddressesExist) {
      showError(`${s.strings.title_register_fio_address}. ${s.strings.fio_request_by_fio_address_error_no_address}`)
      return
    }
    if (this.amounts) {
      const native = parseFloat(this.amounts.nativeAmount)
      if (native <= 0) {
        showError(`${s.strings.fio_request_by_fio_address_error_invalid_amount_header}. ${s.strings.fio_request_by_fio_address_error_invalid_amount}`)
        return
      }
    } else {
      showError(`${s.strings.fio_request_by_fio_address_error_invalid_amount_header}. ${s.strings.fio_request_by_fio_address_error_invalid_amount}`)
      return
    }
    const fioAddressModal = createFioAddressModal({ fioPlugin: this.props.fioPlugin, isConnected: this.props.isConnected })
    const fioModalData = await launchModal(fioAddressModal)
    if (fioModalData) {
      Actions[Constants.FIO_REQUEST_CONFIRMATION]({ fioModalData, amounts: this.amounts })
    }
  }
}
