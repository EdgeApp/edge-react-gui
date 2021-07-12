// @flow

import * as React from 'react'
import { ActivityIndicator, Linking, TouchableHighlight, View } from 'react-native'
import { type AirshipBridge, AirshipModal } from 'react-native-airship'
import { RNCamera } from 'react-native-camera'
import RNPermissions from 'react-native-permissions'
import Ionicon from 'react-native-vector-icons/Ionicons'

import s from '../../locales/strings.js'
import T from '../../modules/UI/components/FormattedText/FormattedText.ui'
import type { PermissionStatus } from '../../reducers/PermissionsReducer'
import { connect } from '../../types/reactRedux.js'
import { requestPermission } from '../services/PermissionsManager'
import { type Theme, type ThemeProps, cacheStyles, withTheme } from '../services/ThemeContext.js'
import { ModalCloseArrow, ModalTitle } from '../themed/ModalParts'

type OwnProps = {
  bridge: AirshipBridge<string | void>,
  title: string
}

type StateProps = {
  cameraPermission: PermissionStatus,
  torchEnabled: boolean,
  scanEnabled: boolean
}

type DispatchProps = {
  toggleEnableTorch: () => void,
  enableScan: () => void,
  disableScan: () => void
}
type Props = OwnProps & StateProps & DispatchProps & ThemeProps

export class ScanModalComponent extends React.Component<Props> {
  componentDidMount(): void {
    this.props.enableScan()
    requestPermission('camera')
  }

  componentWillUnmount(): void {
    this.props.disableScan()
  }

  onBarCodeRead = (result: { data: string }) => {
    this.props.bridge.resolve(result.data)
  }

  openSettingsTapped = () => {
    Linking.openSettings()
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

    if (this.props.cameraPermission === RNPermissions.RESULTS.BLOCKED) {
      return (
        <View style={styles.cameraArea}>
          <T style={styles.cameraPermissionDeniedText}>{s.strings.scan_camera_permission_denied}</T>
          <TouchableHighlight style={styles.settingsButton} onPress={this.openSettingsTapped}>
            <T style={styles.settingsButtonText}>{s.strings.open_settings}</T>
          </TouchableHighlight>
        </View>
      )
    }

    if (this.props.cameraPermission === RNPermissions.RESULTS.GRANTED) {
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
        <ActivityIndicator color={theme.primaryText} size="large" />
      </View>
    )
  }

  close = () => {
    this.props.bridge.resolve()
  }

  render() {
    const { bridge, theme, title } = this.props

    return (
      <AirshipModal bridge={bridge} onCancel={this.close} borderRadius={theme.rem(1)} backgroundColor={theme.tileBackground}>
        <ModalTitle>{title}</ModalTitle>
        {this.renderCameraArea()}
        <ModalCloseArrow onPress={this.close} />
      </AirshipModal>
    )
  }
}

const getStyles = cacheStyles((theme: Theme) => ({
  cameraArea: {
    alignItems: 'flex-end',
    flex: 1,
    marginHorizontal: theme.rem(1.25),
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
  }
}))

export const ScanModal = connect<StateProps, DispatchProps, OwnProps>(
  state => ({
    cameraPermission: state.permissions.camera,
    torchEnabled: state.ui.scenes.scan.torchEnabled,
    scanEnabled: state.ui.scenes.scan.scanEnabled
  }),
  dispatch => ({
    toggleEnableTorch() {
      dispatch({ type: 'TOGGLE_ENABLE_TORCH' })
    },
    disableScan() {
      dispatch({ type: 'DISABLE_SCAN' })
    },
    enableScan() {
      dispatch({ type: 'ENABLE_SCAN' })
    }
  })
)(withTheme(ScanModalComponent))
