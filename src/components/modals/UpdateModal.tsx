import * as React from 'react'
import { Image, Linking, Platform, View } from 'react-native'
import { AirshipBridge } from 'react-native-airship'
import { getBundleId } from 'react-native-device-info'
import { sprintf } from 'sprintf-js'

import { lstrings } from '../../locales/strings'
import { config } from '../../theme/appConfig'
import { cacheStyles, Theme, useTheme } from '../services/ThemeContext'
import { MainButton } from '../themed/MainButton'
import { ModalMessage, ModalTitle } from '../themed/ModalParts'
import { ThemedModal } from '../themed/ThemedModal'

interface Props {
  bridge: AirshipBridge<void>
  onSkip: () => void
}

export function UpdateModal(props: Props) {
  const { bridge, onSkip } = props
  const theme = useTheme()
  const styles = getStyles(theme)

  const handleUpdate = async () => {
    const url = Platform.OS === 'android' ? `http://play.app.goo.gl/?link=http://play.google.com/store/apps/details?id=${getBundleId()}` : config.appStore
    await Linking.openURL(url)
    bridge.resolve()
  }

  const handleClose = () => bridge.resolve()
  const message = sprintf(lstrings.update_fresh_new_version, config.appName)

  return (
    <ThemedModal bridge={bridge} onCancel={handleClose}>
      <View style={styles.titleContainer}>
        <Image style={styles.titleImage} resizeMode="contain" source={theme.primaryLogo} />
        <ModalTitle>{lstrings.update_header}</ModalTitle>
      </View>
      <ModalMessage>{message}</ModalMessage>
      <MainButton label={lstrings.update_now} marginRem={0.5} type="primary" onPress={handleUpdate} />
      <MainButton label={lstrings.update_later} marginRem={0.5} type="secondary" onPress={onSkip} />
    </ThemedModal>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  titleContainer: {
    alignItems: 'center',
    flexDirection: 'column'
  },
  titleImage: {
    height: theme.rem(3),
    margin: theme.rem(0.5)
  }
}))
