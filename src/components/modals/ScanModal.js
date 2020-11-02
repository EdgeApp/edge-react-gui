// @flow

import * as React from 'react'
import { ActivityIndicator, TouchableHighlight, View } from 'react-native'
import { type AirshipBridge, AirshipModal } from 'react-native-airship'
import OpenAppSettings from 'react-native-app-settings'
import { RNCamera } from 'react-native-camera'
import Ionicon from 'react-native-vector-icons/Ionicons'
import { connect } from 'react-redux'

import s from '../../locales/strings.js'
import T from '../../modules/UI/components/FormattedText/FormattedText.ui'
import { getSelectedCurrencyCode, getSelectedWalletId } from '../../modules/UI/selectors'
import type { Permission, PermissionStatus } from '../../reducers/PermissionsReducer'
import type { RootState } from '../../reducers/RootReducer'
import type { Dispatch } from '../../types/reduxTypes'
import { requestPermission } from '../services/PermissionsManager'
import { type Theme, type ThemeProps, cacheStyles, withTheme } from '../services/ThemeContext.js'

type OwnProps = {
  bridge: AirshipBridge<string | void>,
  title: string,
  cameraPermission: PermissionStatus,
  torchEnabled: boolean,
  scanEnabled: boolean,
  walletId: string,
  currencyCode: string,
  toggleEnableTorch: () => void,
  enableScan: () => void,
  disableScan: () => void,
  requestPermission: () => void
}
type Props = OwnProps & ThemeProps

export class ScanModalComponent extends React.Component<Props> {
  componentDidMount(): void {
    this.props.enableScan()
    this.props.requestPermission()
  }

  componentWillUnmount(): void {
    this.props.disableScan()
  }

  onBarCodeRead = (result: { data: string }) => {
    this.props.bridge.resolve(result.data)
  }

  openSettingsTapped = () => {
    OpenAppSettings.open()
  }

  _onToggleTorch = () => {
    this.props.toggleEnableTorch()
  }

  renderCameraArea = () => {
    const { theme } = this.props
    const styles = getStyles(theme)

    if (!this.props.scanEnabled) {
      return <View style={styles.cameraArea} />
    }

    if (this.props.cameraPermission === 'denied') {
      return (
        <View style={styles.cameraArea}>
          <T style={styles.cameraPermissionDeniedText}>{s.strings.scan_camera_permission_denied}</T>
          <TouchableHighlight style={styles.settingsButton} onPress={this.openSettingsTapped}>
            <T style={styles.settingsButtonText}>{s.strings.open_settings}</T>
          </TouchableHighlight>
        </View>
      )
    }

    if (this.props.cameraPermission === 'authorized') {
      const flashMode = this.props.torchEnabled ? RNCamera.Constants.FlashMode.torch : RNCamera.Constants.FlashMode.off

      return (
        <RNCamera style={styles.cameraArea} captureAudio={false} flashMode={flashMode} onBarCodeRead={this.onBarCodeRead} type={RNCamera.Constants.Type.back}>
          <TouchableHighlight style={styles.bottomButton} onPress={this._onToggleTorch} underlayColor={theme.secondaryButton}>
            <View style={styles.bottomButtonTextWrap}>
              <Ionicon style={styles.flashIcon} name="ios-flash" size={theme.rem(1.5)} />
              <T style={styles.bottomButtonText}>{s.strings.fragment_send_flash}</T>
            </View>
          </TouchableHighlight>
        </RNCamera>
      )
    }

    return (
      <View style={styles.cameraArea}>
        <ActivityIndicator size="large" />
      </View>
    )
  }

  close = () => {
    this.props.bridge.resolve()
  }

  render() {
    const { bridge, theme, title } = this.props
    const styles = getStyles(theme)
    return (
      <AirshipModal bridge={bridge} onCancel={this.close} borderRadius={theme.rem(1)} backgroundColor={theme.tileBackground}>
        <T style={styles.header}>{title}</T>
        {this.renderCameraArea()}
        <TouchableHighlight style={styles.closeButton} onPress={this.close} underlayColor={theme.secondaryButton}>
          <Ionicon style={styles.flashIcon} name="ios-arrow-down" size={theme.rem(1.5)} />
        </TouchableHighlight>
      </AirshipModal>
    )
  }
}

const getStyles = cacheStyles((theme: Theme) => ({
  header: {
    width: '100%',
    textAlign: 'center',
    fontSize: theme.rem(1.5),
    paddingVertical: theme.rem(0.75),
    color: theme.primaryText
  },

  cameraArea: {
    alignItems: 'flex-end',
    flex: 1,
    justifyContent: 'flex-end'
  },

  // Permission denied view:
  cameraPermissionDeniedText: {
    color: theme.primaryText,
    textAlign: 'center',
    fontSize: theme.rem(0.875),
    padding: theme.rem(1.5)
  },
  settingsButton: {
    backgroundColor: theme.secondaryText,
    alignItems: 'center',
    padding: theme.rem(0.75)
  },
  settingsButtonText: {
    color: theme.primaryText
  },

  // Bottom button area:
  flashIcon: {
    color: theme.primaryText,
    fontSize: theme.rem(1.375),
    height: theme.rem(1.125)
  },
  bottomButton: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.secondaryButton,
    borderRadius: theme.rem(0.125),
    height: theme.rem(3),
    marginBottom: theme.rem(1),
    marginLeft: theme.rem(0.5),
    marginRight: theme.rem(1)
  },
  bottomButtonTextWrap: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.secondaryButton,
    padding: theme.rem(0.5)
  },
  bottomButtonText: {
    opacity: 1,
    color: theme.primaryText,
    fontSize: theme.rem(0.875),
    backgroundColor: 'transparent'
  },
  closeButton: {
    width: '100%',
    padding: theme.rem(0.5),
    height: theme.rem(2.5),
    justifyContent: 'center',
    alignItems: 'center'
  }
}))

export const ScanModal = connect(
  (state: RootState) => ({
    cameraPermission: state.permissions.camera,
    torchEnabled: state.ui.scenes.scan.torchEnabled,
    scanEnabled: state.ui.scenes.scan.scanEnabled,
    walletId: getSelectedWalletId(state),
    currencyCode: getSelectedCurrencyCode(state)
  }),
  (dispatch: Dispatch) => ({
    toggleEnableTorch: () => dispatch({ type: 'TOGGLE_ENABLE_TORCH' }),
    disableScan: () => {
      dispatch({ type: 'DISABLE_SCAN' })
    },
    enableScan: () => {
      dispatch({ type: 'ENABLE_SCAN' })
    },
    requestPermission: (permission: Permission) => {
      requestPermission(permission)
    }
  })
)(withTheme(ScanModalComponent))
