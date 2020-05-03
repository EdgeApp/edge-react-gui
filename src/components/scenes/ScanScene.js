// @flow

import React, { Component, Fragment } from 'react'
import { ActivityIndicator, Text, TouchableHighlight, View } from 'react-native'
import OpenAppSettings from 'react-native-app-settings'
import { RNCamera } from 'react-native-camera'
// $FlowFixMe
import slowlog from 'react-native-slowlog'
import FAIcon from 'react-native-vector-icons/FontAwesome'
import Ionicon from 'react-native-vector-icons/Ionicons'

import SecondaryModal from '../../connectors/SecondaryModalConnector.js'
import s from '../../locales/strings.js'
import T from '../../modules/UI/components/FormattedText/index'
import { type PermissionStatus } from '../../reducers/PermissionsReducer.js'
import styles, { styles as styleRaw } from '../../styles/scenes/ScaneStyle'
import { scale } from '../../util/scaling.js'
import { SceneWrapper } from '../common/SceneWrapper.js'

type Props = {
  cameraPermission: PermissionStatus,
  torchEnabled: boolean,
  scanEnabled: boolean,
  qrCodeScanned: (data: string) => void,
  parseScannedUri: (data: string) => Promise<void>,
  toggleEnableTorch: () => void,
  toggleAddressModal: () => void,
  toggleScanToWalletListModal: () => void
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
    slowlog(this, /.*/, global.slowlogOptions)
  }

  render () {
    return (
      <Fragment>
        <SceneWrapper background="header" hasTabs={false}>
          {this.renderCameraArea()}
          <View style={styles.overlayButtonAreaWrap}>
            <TouchableHighlight style={styles.bottomButton} onPress={this._onToggleAddressModal} underlayColor={styleRaw.underlay.color}>
              <View style={styles.bottomButtonTextWrap}>
                <FAIcon style={styles.addressBookIcon} name="address-book-o" size={scale(18)} />
                <T style={styles.bottomButtonText}>{ADDRESS_TEXT}</T>
              </View>
            </TouchableHighlight>

            <TouchableHighlight style={styles.bottomButton} onPress={this._onToggleTorch} underlayColor={styleRaw.underlay.color}>
              <View style={styles.bottomButtonTextWrap}>
                <Ionicon style={styles.flashIcon} name="ios-flash" size={scale(24)} />
                <T style={styles.bottomButtonText}>{FLASH_TEXT}</T>
              </View>
            </TouchableHighlight>
          </View>
        </SceneWrapper>
        <SecondaryModal />
      </Fragment>
    )
  }

  _onToggleTorch = () => {
    this.props.toggleEnableTorch()
  }

  _onToggleAddressModal = () => {
    this.props.toggleAddressModal()
  }

  openSettingsTapped = () => {
    OpenAppSettings.open()
  }

  onBarCodeRead = (result: { data: string }) => {
    return this.props.qrCodeScanned(result.data)
  }

  renderCameraArea = () => {
    if (!this.props.scanEnabled) {
      return <View style={styles.cameraArea} />
    }

    if (this.props.cameraPermission === 'denied') {
      return (
        <View style={styles.cameraArea}>
          <Text style={styles.cameraPermissionDeniedText}>{DENIED_PERMISSION_TEXT}</Text>
          <TouchableHighlight style={styles.settingsButton} onPress={this.openSettingsTapped}>
            <Text style={styles.settingsButtonText}>{OPEN_SETTINGS_TEXT}</Text>
          </TouchableHighlight>
        </View>
      )
    }

    if (this.props.cameraPermission === 'authorized') {
      const flashMode = this.props.torchEnabled ? RNCamera.Constants.FlashMode.torch : RNCamera.Constants.FlashMode.off

      return (
        <RNCamera style={styles.cameraArea} captureAudio={false} flashMode={flashMode} onBarCodeRead={this.onBarCodeRead} type={RNCamera.Constants.Type.back}>
          <View style={styles.overlayTop}>
            <T style={styles.overlayTopText}>{HEADER_TEXT}</T>
          </View>
        </RNCamera>
      )
    }

    return (
      <View style={styles.cameraArea}>
        <ActivityIndicator size="large" />
      </View>
    )
  }
}

export default Scan
