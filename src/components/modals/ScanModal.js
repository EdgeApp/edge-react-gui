// @flow
import * as React from 'react'
import { type LayoutChangeEvent, ActivityIndicator, Linking, TouchableHighlight, View } from 'react-native'
import { type AirshipBridge, AirshipModal } from 'react-native-airship'
import { RNCamera } from 'react-native-camera'
// $FlowFixMe
import { launchImageLibrary } from 'react-native-image-picker/src/index.ts'
import RNPermissions from 'react-native-permissions'
import Ionicon from 'react-native-vector-icons/Ionicons'
import RNQRGenerator from 'rn-qr-generator'

import s from '../../locales/strings.js'
import type { PermissionStatus } from '../../reducers/PermissionsReducer'
import { useEffect, useState } from '../../types/reactHooks.js'
import { connect } from '../../types/reactRedux.js'
import { QrPeephole } from '../common/QrPeephole.js'
import { showError, showWarning } from '../services/AirshipInstance.js'
import { requestPermission } from '../services/PermissionsManager'
import { type Theme, type ThemeProps, cacheStyles, withTheme } from '../services/ThemeContext.js'
import { ModalCloseArrow, ModalMessage } from '../themed/ModalParts'
import { SceneHeader } from '../themed/SceneHeader.js'

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

const Component = (props: Props) => {
  const { bridge, theme, title, enableScan, disableScan, scanEnabled, toggleEnableTorch, torchEnabled, cameraPermission } = props
  const styles = getStyles(theme)

  // Mount effects
  useEffect(() => {
    enableScan()
    requestPermission('camera')

    return disableScan
  }, [])

  const handleBarCodeRead = (result: { data: string }) => {
    bridge.resolve(result.data)
  }

  const handleSettings = () => {
    Linking.openSettings()
  }

  const handleFlash = () => {
    toggleEnableTorch()
  }

  const handleAlbum = () => {
    launchImageLibrary(
      {
        mediaType: 'photo'
      },
      async result => {
        if (result.didCancel) return

        if (result.errorMessage) {
          showError(result.errorMessage)
          return
        }

        const asset = result.assets != null ? result.assets[0] : undefined

        if (asset == null) {
          showWarning(s.strings.scan_camera_missing_qrcode)
          return
        }

        try {
          const response = await RNQRGenerator.detect({
            uri: asset.uri
          })

          if (response.values.length === 0) {
            showWarning(s.strings.scan_camera_missing_qrcode)
            return
          }

          console.log(`QR code read from photo libary:`, response.values[0])
          bridge.resolve(response.values[0])
        } catch (error) {
          showError(error)
        }
      }
    )
  }

  const handleLayoutCameraContainer = (event: LayoutChangeEvent) => {
    setQrPeepholeHeight(event.nativeEvent.layout.height)
    setQrPeepholeWidth(event.nativeEvent.layout.width)
  }

  const handleLayoutPeepholeSpace = (event: LayoutChangeEvent) => {
    setPeepholeSpaceY(event.nativeEvent.layout.y)
    setPeepholeSpaceHeight(event.nativeEvent.layout.height)
  }

  const handleClose = () => {
    bridge.resolve()
  }

  const airshipMarginTop = theme.rem(3)
  const [peepholeWidth, setQrPeepholeWidth] = useState(0)
  const [peepholeHeight, setQrPeepholeHeight] = useState(0)
  const [peepholeSpaceHeight, setPeepholeSpaceHeight] = useState(0)
  const [peepholeSpaceY, setPeepholeSpaceY] = useState(0)
  const peepholeSize = Math.round((peepholeWidth * 2) / 3)
  const peepholeTop = peepholeSpaceY + (peepholeSpaceHeight - peepholeSize) / 2

  const renderModalContent = () => {
    if (!scanEnabled) {
      return null
    }

    if (cameraPermission === RNPermissions.RESULTS.BLOCKED) {
      return (
        <>
          <ModalMessage style={styles.cameraPermissionDeniedText}>{s.strings.scan_camera_permission_denied}</ModalMessage>
          <TouchableHighlight style={styles.settingsButton} onPress={handleSettings}>
            <ModalMessage style={styles.settingsButtonText}>{s.strings.open_settings}</ModalMessage>
          </TouchableHighlight>
        </>
      )
    }

    if (cameraPermission === RNPermissions.RESULTS.GRANTED) {
      const flashMode = torchEnabled ? RNCamera.Constants.FlashMode.torch : RNCamera.Constants.FlashMode.off

      return (
        <>
          <View style={styles.cameraContainer} onLayout={handleLayoutCameraContainer}>
            <RNCamera
              style={styles.cameraArea}
              captureAudio={false}
              flashMode={flashMode}
              onBarCodeRead={handleBarCodeRead}
              type={RNCamera.Constants.Type.back}
            />
          </View>

          <QrPeephole width={peepholeWidth} height={peepholeHeight} holeSize={peepholeSize} holeTop={peepholeTop} />

          <View style={styles.overlayContainer}>
            <View style={styles.headerContainer}>
              <SceneHeader withTopMargin title={title} underline />
            </View>
            <View style={[styles.peepholeSpace, { minHeight: peepholeSize }]} onLayout={handleLayoutPeepholeSpace} />
            <View style={styles.buttonsContainer}>
              <TouchableHighlight style={styles.iconButton} onPress={handleFlash} underlayColor={theme.secondaryButton}>
                <>
                  <Ionicon style={styles.icon} name="flash-outline" size={theme.rem(1.5)} />
                  <ModalMessage>{s.strings.fragment_send_flash}</ModalMessage>
                </>
              </TouchableHighlight>
              <TouchableHighlight style={styles.iconButton} onPress={handleAlbum} underlayColor={theme.secondaryButton}>
                <>
                  <Ionicon style={styles.icon} name="albums-outline" size={theme.rem(1.5)} />
                  <ModalMessage>{s.strings.fragment_send_album}</ModalMessage>
                </>
              </TouchableHighlight>
            </View>
          </View>
        </>
      )
    }

    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={theme.primaryText} size="large" />
      </View>
    )
  }

  return (
    <AirshipModal bridge={bridge} margin={[airshipMarginTop, 0, 0]} padding={0} backgroundColor={theme.modal} onCancel={handleClose} overflow="hidden">
      {renderModalContent()}
      <View style={styles.overlayArrowContainer}>
        <ModalCloseArrow onPress={handleClose} />
      </View>
    </AirshipModal>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
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
  // Camera View
  cameraContainer: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0
  },
  cameraArea: {
    flex: 1
  },
  // Overlay UI
  overlayContainer: {
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    justifyContent: 'space-between',
    flex: 1
  },
  headerContainer: {
    justifyContent: 'flex-end',
    marginTop: theme.rem(1)
  },
  peepholeSpace: {
    aspectRatio: 1
  },
  // Buttons
  buttonsContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around'
  },
  iconButton: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.rem(0.5)
  },
  icon: {
    color: theme.iconTappable,
    fontSize: theme.rem(2),
    height: theme.rem(2.5)
  },
  // Arrow
  overlayArrowContainer: {
    height: theme.rem(3)
  },
  // Loading Fallback
  loadingContainer: {
    flex: 1,
    justifyContent: 'center'
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
)(withTheme(Component))
