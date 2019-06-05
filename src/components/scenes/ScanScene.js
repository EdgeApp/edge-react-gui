// @flow

import React, { Component } from 'react'
import { ActivityIndicator, Text, TouchableHighlight, View } from 'react-native'
import OpenAppSettings from 'react-native-app-settings'
import { RNCamera } from 'react-native-camera'
// $FlowFixMe
import slowlog from 'react-native-slowlog'
import FAIcon from 'react-native-vector-icons/FontAwesome'
import Ionicon from 'react-native-vector-icons/Ionicons'

import SecondaryModal from '../../connectors/SecondaryModalConnector.js'
import * as Constants from '../../constants/indexConstants'
import { scale } from '../../lib/scaling.js'
import s from '../../locales/strings.js'
import { PermissionStatusStrings } from '../../modules/PermissionsManager.js'
import type { PermissionStatus } from '../../modules/PermissionsManager.js'
import ABAlert from '../../modules/UI/components/ABAlert/indexABAlert'
import T from '../../modules/UI/components/FormattedText/index'
import Gradient from '../../modules/UI/components/Gradient/Gradient.ui'
import SafeAreaView from '../../modules/UI/components/SafeAreaView/index'
import WalletListModal from '../../modules/UI/components/WalletListModal/WalletListModalConnector'
import styles, { styles as styleRaw } from '../../styles/scenes/ScaneStyle'
import { type GuiWallet } from '../../types.js'

type Props = {
  cameraPermission: PermissionStatus,
  torchEnabled: boolean,
  scanEnabled: boolean,
  showToWalletModal: boolean,
  deepLinkPending: boolean,
  deepLinkUri: string | null,
  qrCodeScanned: (data: string) => void,
  parseScannedUri: (data: string) => void,
  toggleEnableTorch: () => void,
  toggleAddressModal: () => void,
  toggleScanToWalletListModal: () => void,
  onSelectWallet: (string, string) => void,
  markAddressDeepLinkDone: () => any,
  wallets: { [string]: GuiWallet }
}

const HEADER_TEXT = s.strings.send_scan_header_text

const DENIED_PERMISSION_TEXT = s.strings.scan_camera_permission_denied // blank string because way off-centered (not sure reason why)
const OPEN_SETTINGS_TEXT = s.strings.open_settings
// const TRANSFER_TEXT = s.strings.fragment_send_transfer
const ADDRESS_TEXT = s.strings.fragment_send_address
const FLASH_TEXT = s.strings.fragment_send_flash

export class Scan extends Component<Props> {
  constructor (props: Props) {
    super(props)

    this.checkForDeepLink()

    slowlog(this, /.*/, global.slowlogOptions)
  }

  componentDidUpdate () {
    this.checkForDeepLink()
  }

  checkForDeepLink () {
    if (this.props.deepLinkUri && this.props.deepLinkPending) {
      const deepLinkUri = this.props.deepLinkUri
      this.props.markAddressDeepLinkDone()
      this.props.parseScannedUri(deepLinkUri)
    }
  }

  render () {
    const { onSelectWallet, wallets } = this.props
    const allowedWallets = {}
    for (const id in wallets) {
      const wallet = wallets[id]
      if (wallet.receiveAddress && wallet.receiveAddress.publicAddress) {
        allowedWallets[id] = wallets[id]
      }
    }
    return (
      <SafeAreaView>
        <View style={{ flex: 1 }}>
          <Gradient style={styles.gradient} />
          <View style={styles.topSpacer} />

          <View style={styles.container}>
            {this.renderCamera()}

            <View style={[styles.overlay]}>
              <View style={[styles.overlayTop]}>
                <T style={[styles.overlayTopText]}>{HEADER_TEXT}</T>
              </View>

              <View style={[styles.overlayBlank]}>
                {this.props.cameraPermission === PermissionStatusStrings.DENIED && (
                  <View style={[styles.preview, { justifyContent: 'center', alignItems: 'center' }]}>
                    <Text style={styles.cameraPermissionDeniedText}>{DENIED_PERMISSION_TEXT}</Text>
                    <TouchableHighlight style={styles.settingsButton} onPress={this.openSettingsTapped}>
                      <Text style={styles.settingsButtonText}>{OPEN_SETTINGS_TEXT}</Text>
                    </TouchableHighlight>
                  </View>
                )}
              </View>

              <Gradient style={[styles.overlayButtonAreaWrap]}>
                <TouchableHighlight style={styles.bottomButton} onPress={this._onToggleAddressModal} underlayColor={styleRaw.underlay.color}>
                  <View style={styles.bottomButtonTextWrap}>
                    <FAIcon style={[styles.addressBookIcon]} name="address-book-o" size={scale(18)} />
                    <T style={[styles.addressButtonText, styles.bottomButtonText]}>{ADDRESS_TEXT}</T>
                  </View>
                </TouchableHighlight>

                <TouchableHighlight style={styles.bottomButton} onPress={this._onToggleTorch} underlayColor={styleRaw.underlay.color}>
                  <View style={styles.bottomButtonTextWrap}>
                    <Ionicon style={[styles.flashIcon]} name="ios-flash" size={scale(24)} />
                    <T style={[styles.flashButtonText, styles.bottomButtonText]}>{FLASH_TEXT}</T>
                  </View>
                </TouchableHighlight>
              </Gradient>
            </View>
            <ABAlert />
          </View>
          {this.props.showToWalletModal && (
            <WalletListModal
              wallets={allowedWallets}
              topDisplacement={Constants.SCAN_WALLET_DIALOG_TOP}
              type={Constants.FROM}
              onSelectWallet={onSelectWallet}
            />
          )}
        </View>
        <SecondaryModal />
      </SafeAreaView>
    )
  }

  _onToggleTorch = () => {
    this.props.toggleEnableTorch()
  }

  _onToggleAddressModal = () => {
    this.props.toggleAddressModal()
  }

  // selectPhotoTapped = () => {
  //   const options = { takePhotoButtonTitle: null }

  //   ImagePicker.showImagePicker(options, response => {
  //     if (!response.didCancel && !response.error && !response.customButton) {
  //       // this.refs.cameraCapture.capture({})
  //       // You can also display the image using data:
  //       // let source = { uri: 'data:image/jpeg;base64,' + response.data };
  //       // TODO: make edgelogin work with image picker -paulvp
  //       /* if (/^airbitz:\/\/edge\//.test(uri)) {
  //         return
  //       } */
  //       Actions[Constants.SEND_CONFIRMATION]()
  //     }
  //   })
  // }

  openSettingsTapped = () => {
    OpenAppSettings.open()
  }

  onBarCodeRead = (result: { data: string }) => {
    return this.props.qrCodeScanned(result.data)
  }

  renderCamera = () => {
    if (!this.props.scanEnabled) {
      return null
    }
    if (this.props.cameraPermission === PermissionStatusStrings.AUTHORIZED) {
      const flashMode = this.props.torchEnabled ? RNCamera.Constants.FlashMode.torch : RNCamera.Constants.FlashMode.off

      return (
        <RNCamera style={styles.preview} flashMode={flashMode} type={RNCamera.Constants.Type.back} ref="cameraCapture" onBarCodeRead={this.onBarCodeRead} />
      )
    } else if (this.props.cameraPermission === PermissionStatusStrings.DENIED) {
      return <View />
    } else {
      return (
        <View style={[{ flex: 1, justifyContent: 'center', alignItems: 'center' }]}>
          <ActivityIndicator size="large" style={{ flex: 1, alignSelf: 'center' }} />
        </View>
      )
    }
  }
}

export default Scan
