// @flow

import * as React from 'react'
import { ActivityIndicator, Linking, StyleSheet, Text, TouchableHighlight, View } from 'react-native'
import { RNCamera } from 'react-native-camera'
import RNPermissions from 'react-native-permissions'
import { Actions } from 'react-native-router-flux'
import IonIcon from 'react-native-vector-icons/Ionicons'

import SecondaryModal from '../../connectors/SecondaryModalConnector.js'
import s from '../../locales/strings.js'
import T from '../../modules/UI/components/FormattedText/FormattedText.ui.js'
import { type PermissionStatus } from '../../reducers/PermissionsReducer.js'
import { THEME } from '../../theme/variables/airbitz.js'
import { scale } from '../../util/scaling.js'
import { SceneWrapper } from '../common/SceneWrapper.js'
import { AddressModal } from '../modals/AddressModal.js'
import { Airship } from '../services/AirshipInstance'

type Props = {
  cameraPermission: PermissionStatus,
  torchEnabled: boolean,
  scanEnabled: boolean,
  currentWalletId: string,
  currentCurrencyCode: string,
  walletId: string,
  currencyCode: string,
  qrCodeScanned: (data: string) => void,
  parseScannedUri: (data: string) => Promise<void>,
  toggleEnableTorch: () => void,
  toggleScanToWalletListModal: () => void,
  selectFromWalletForExchange: (walletId: string, currencyCode: string) => void
}

export class Scan extends React.Component<Props> {
  render() {
    return (
      <>
        <SceneWrapper background="header" hasTabs={false}>
          {this.renderCameraArea()}
          <View style={styles.overlayButtonAreaWrap}>
            <TouchableHighlight style={styles.bottomButton} onPress={this._onToggleTorch} underlayColor={THEME.COLORS.SECONDARY}>
              <View style={styles.bottomButtonTextWrap}>
                <IonIcon style={styles.flashIcon} name="ios-flash" size={scale(24)} />
                <T style={styles.bottomButtonText}>{s.strings.fragment_send_flash}</T>
              </View>
            </TouchableHighlight>
          </View>
        </SceneWrapper>
        <SecondaryModal />
      </>
    )
  }

  _onPressTransfer = () => {
    const { selectFromWalletForExchange, currentWalletId, currentCurrencyCode } = this.props
    selectFromWalletForExchange(currentWalletId, currentCurrencyCode)
    Actions.exchangeScene()
  }

  _onToggleTorch = () => {
    this.props.toggleEnableTorch()
  }

  _onToggleAddressModal = async () => {
    const { walletId, currencyCode } = this.props
    const uri = await Airship.show(bridge => (
      <AddressModal
        bridge={bridge}
        walletId={walletId}
        currencyCode={currencyCode}
        title={s.strings.scan_address_modal_title}
        showPasteButton
        checkAddressConnected
      />
    ))
    if (uri) {
      this.props.parseScannedUri(uri)
    }
  }

  openSettingsTapped = () => {
    Linking.openSettings()
  }

  onBarCodeRead = (result: { data: string }) => {
    return this.props.qrCodeScanned(result.data)
  }

  renderCameraArea = () => {
    if (!this.props.scanEnabled) {
      return <View style={styles.cameraArea} />
    }

    if (this.props.cameraPermission === RNPermissions.RESULTS.BLOCKED) {
      return (
        <View style={styles.cameraArea}>
          <Text style={styles.cameraPermissionDeniedText}>{s.strings.scan_camera_permission_denied}</Text>
          <TouchableHighlight style={styles.settingsButton} onPress={this.openSettingsTapped}>
            <Text style={styles.settingsButtonText}>{s.strings.open_settings}</Text>
          </TouchableHighlight>
        </View>
      )
    }

    if (this.props.cameraPermission === RNPermissions.RESULTS.GRANTED) {
      const flashMode = this.props.torchEnabled ? RNCamera.Constants.FlashMode.torch : RNCamera.Constants.FlashMode.off

      return (
        <RNCamera style={styles.cameraArea} captureAudio={false} flashMode={flashMode} onBarCodeRead={this.onBarCodeRead} type={RNCamera.Constants.Type.back}>
          <View style={styles.overlayTop}>
            <T style={styles.overlayTopText}>{s.strings.send_scan_edge_login_or_sweep_private_key}</T>
          </View>
        </RNCamera>
      )
    }

    return (
      <View style={styles.cameraArea}>
        <ActivityIndicator color={THEME.COLORS.ACCENT_MINT} size="large" />
      </View>
    )
  }
}

const rawStyles = {
  // Camera area:
  cameraArea: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center'
  },
  overlayTop: {
    alignItems: 'center',
    backgroundColor: THEME.COLORS.GRAY_1,
    justifyContent: 'center',
    opacity: 0.95,
    padding: scale(7),
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0
  },
  overlayTopText: {
    color: THEME.COLORS.WHITE,
    textAlign: 'center',
    fontSize: scale(14)
  },

  // Permission denied view:
  cameraPermissionDeniedText: {
    color: THEME.COLORS.WHITE,
    textAlign: 'center',
    fontSize: scale(14),
    padding: 20
  },
  settingsButton: {
    backgroundColor: THEME.COLORS.SECONDARY,
    alignItems: 'center',
    padding: 10
  },
  settingsButtonText: {
    color: THEME.COLORS.WHITE
  },

  // Bottom button area:
  overlayButtonAreaWrap: {
    flexDirection: 'row',
    paddingTop: scale(11),
    paddingBottom: scale(11),
    paddingRight: scale(8),
    paddingLeft: scale(8)
  },
  bottomButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: `${THEME.COLORS.WHITE}${THEME.ALPHA.LOW}`,
    borderRadius: scale(3),
    height: scale(50),
    marginLeft: scale(1),
    marginRight: scale(1)
  },
  bottomButtonTextWrap: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center'
  },
  transferIcon: {
    color: THEME.COLORS.WHITE,
    fontSize: scale(16),
    height: scale(16)
  },
  addressBookIcon: {
    color: THEME.COLORS.WHITE,
    fontSize: scale(16),
    height: scale(16),
    transform: [{ scaleX: -1.0 }]
  },
  flashIcon: {
    color: THEME.COLORS.WHITE,
    fontSize: scale(22),
    height: scale(18)
  },
  bottomButtonText: {
    opacity: 1,
    color: THEME.COLORS.WHITE,
    fontSize: scale(14),
    backgroundColor: THEME.COLORS.TRANSPARENT
  }
}
const styles: typeof rawStyles = StyleSheet.create(rawStyles)

export default Scan
