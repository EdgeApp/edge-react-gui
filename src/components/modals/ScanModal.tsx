import * as React from 'react'
import { Linking, TouchableOpacity, View } from 'react-native'
import { AirshipBridge, AirshipModal } from 'react-native-airship'
import { RNCamera } from 'react-native-camera'
import { launchImageLibrary } from 'react-native-image-picker'
import RNPermissions from 'react-native-permissions'
import { useSafeAreaFrame } from 'react-native-safe-area-context'
import Ionicon from 'react-native-vector-icons/Ionicons'
import RNQRGenerator from 'rn-qr-generator'

import { useLayout } from '../../hooks/useLayout'
import { lstrings } from '../../locales/strings'
import { useSelector } from '../../types/reactRedux'
import { triggerHaptic } from '../../util/haptic'
import { logActivity } from '../../util/logger'
import { QrPeephole } from '../common/QrPeephole'
import { TextInputModal } from '../modals/TextInputModal'
import { Airship, showError, showWarning } from '../services/AirshipInstance'
import { checkAndRequestPermission } from '../services/PermissionsManager'
import { cacheStyles, Theme, useTheme } from '../services/ThemeContext'
import { EdgeText } from '../themed/EdgeText'
import { MainButton } from '../themed/MainButton'
import { ModalFooter, ModalMessage } from '../themed/ModalParts'
import { SceneHeader } from '../themed/SceneHeader'

interface Props {
  bridge: AirshipBridge<string | undefined>
  textModalAutoFocus?: boolean
  textModalBody?: React.ReactNode | string
  textModalHint?: string
  textModalTitle?: string
  title: string
}

export const ScanModal = (props: Props) => {
  const { bridge, textModalAutoFocus, textModalBody, textModalHint, textModalTitle, title } = props

  const theme = useTheme()
  const styles = getStyles(theme)

  const { width: windowWidth, height: windowHeight } = useSafeAreaFrame()
  const isLandscape = windowWidth > windowHeight

  const cameraPermission = useSelector(state => state.permissions.camera)
  const [torchEnabled, setTorchEnabled] = React.useState(false)
  const [scanEnabled, setScanEnabled] = React.useState(false)

  const handleFlash = () => {
    triggerHaptic('impactLight')
    setTorchEnabled(!torchEnabled)
  }

  // Mount effects
  React.useEffect(() => {
    setScanEnabled(true)
    checkAndRequestPermission('camera').catch(err => showError(err))
    return () => setScanEnabled(false)
  }, [])

  const handleBarCodeRead = (result: { data: string }) => {
    triggerHaptic('impactLight')
    bridge.resolve(result.data)
  }

  const handleSettings = async () => {
    triggerHaptic('impactLight')
    await Linking.openSettings()
  }

  const handleTextInput = async () => {
    triggerHaptic('impactLight')
    const uri = await Airship.show<string | undefined>(bridge => (
      <TextInputModal autoFocus={textModalAutoFocus} bridge={bridge} inputLabel={textModalHint} message={textModalBody} title={textModalTitle} />
    ))

    if (uri != null) {
      bridge.resolve(uri)
    }
  }

  const handleAlbum = () => {
    triggerHaptic('impactLight')
    launchImageLibrary(
      {
        mediaType: 'photo'
      },
      result => {
        if (result.didCancel) return

        if (result.errorMessage) {
          showError(result.errorMessage)
          return
        }

        const asset = result.assets != null ? result.assets[0] : undefined

        if (asset == null) {
          showWarning(lstrings.scan_camera_missing_qrcode)
          return
        }

        RNQRGenerator.detect({
          uri: asset.uri
        })
          .then(response => {
            if (response.values.length === 0) {
              showWarning(lstrings.scan_camera_missing_qrcode)
              return
            }

            logActivity(`QR code read from photo library.`)
            bridge.resolve(response.values[0])
          })
          .catch(error => {
            showError(error)
          })
      }
    ).catch(err => showError(err))
  }

  const handleClose = () => {
    triggerHaptic('impactLight')
    // @ts-expect-error
    bridge.resolve()
  }

  const airshipMarginTop = theme.rem(3)
  const [headerContainerLayout, handleLayoutHeaderContainer] = useLayout()
  const [cameraContainerLayout, handleLayoutCameraContainer] = useLayout()
  const [peepholeSpaceLayout, handleLayoutPeepholeSpace] = useLayout()

  const holeSize = Math.round((Math.min(peepholeSpaceLayout.height, peepholeSpaceLayout.width) * 2) / 3)
  const holeX = (peepholeSpaceLayout.width - holeSize) / 2
  const holeY = headerContainerLayout.y + headerContainerLayout.height + (peepholeSpaceLayout.height - holeSize) / 2

  const renderModalContent = () => {
    if (!scanEnabled) {
      return null
    }

    if (cameraPermission === RNPermissions.RESULTS.GRANTED || cameraPermission === RNPermissions.RESULTS.LIMITED) {
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

          <QrPeephole
            width={cameraContainerLayout.width}
            height={cameraContainerLayout.height}
            holeSize={holeSize}
            holeX={holeX}
            holeY={holeY}
            /* holeOffset={holeOffset} */
          />

          <View style={styles.overlayContainer}>
            <View style={styles.headerContainer} onLayout={handleLayoutHeaderContainer}>
              <SceneHeader title={title} underline withTopMargin />
            </View>
            <View style={[styles.inner, { flexDirection: isLandscape ? 'row' : 'column' }]}>
              <View style={styles.peepholeSpace} onLayout={handleLayoutPeepholeSpace} />
              <View style={[styles.buttonsContainer, { flexDirection: isLandscape ? 'column-reverse' : 'row' }]}>
                <TouchableOpacity style={styles.iconButton} onPress={handleFlash}>
                  <Ionicon style={styles.icon} name={flashMode ? 'flash' : 'flash-outline'} />
                  <EdgeText>{lstrings.fragment_send_flash}</EdgeText>
                </TouchableOpacity>
                <TouchableOpacity style={styles.iconButton} onPress={handleAlbum}>
                  <Ionicon style={styles.icon} name="albums-outline" />
                  <EdgeText>{lstrings.fragment_send_album}</EdgeText>
                </TouchableOpacity>
                <TouchableOpacity style={styles.iconButton} onPress={handleTextInput}>
                  <Ionicon style={styles.icon} name="pencil-outline" />
                  <EdgeText>{lstrings.enter_as_in_enter_address_with_keyboard}</EdgeText>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </>
      )
    }

    return (
      <View style={styles.cameraPermissionContainer}>
        <ModalMessage>{lstrings.scan_camera_permission_denied}</ModalMessage>
        <MainButton onPress={handleSettings} label={lstrings.open_settings} marginRem={0.5} />
      </View>
    )
  }

  return (
    <AirshipModal
      bridge={bridge}
      margin={[airshipMarginTop, 0, 0]}
      padding={0}
      backgroundColor={theme.modal}
      onCancel={handleClose}
      overflow="hidden"
      maxWidth={windowWidth}
    >
      {renderModalContent()}
      <ModalFooter onPress={handleClose} />
    </AirshipModal>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  cameraPermissionContainer: {
    padding: theme.rem(0.5)
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
  inner: {
    flex: 1
  },
  headerContainer: {
    justifyContent: 'flex-end',
    marginBottom: theme.rem(0.5),
    marginTop: theme.rem(1)
  },
  peepholeSpace: {
    flex: 2
  },
  // Buttons
  buttonsContainer: {
    flex: 1,
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
  }
}))
