// @flow

import * as React from 'react'
import { Image, Linking, Platform, View } from 'react-native'
import { type AirshipBridge } from 'react-native-airship'
import { getBundleId } from 'react-native-device-info'
import { sprintf } from 'sprintf-js'

import edgeLogo from '../../assets/images/edgeLogo/Edge_logo_Icon.png'
import s from '../../locales/strings.js'
import { config } from '../../theme/appConfig'
import { cacheStyles, useTheme } from '../services/ThemeContext'
import { MainButton } from '../themed/MainButton'
import { ModalCloseArrow, ModalMessage, ModalTitle } from '../themed/ModalParts'
import { ThemedModal } from '../themed/ThemedModal'

type Props = {
  bridge: AirshipBridge<void>,
  onSkip: () => void
}

export function UpdateModal(props: Props) {
  const { bridge, onSkip } = props
  const theme = useTheme()
  const styles = getStyles(theme)

  const handleUpdate = () => {
    const url = Platform.OS === 'android' ? `http://play.app.goo.gl/?link=http://play.google.com/store/apps/details?id=${getBundleId()}` : config.appStore
    Linking.openURL(url)
    bridge.resolve()
  }

  const handleClose = () => bridge.resolve()
  const message = sprintf(s.strings.update_fresh_new_version, config.appName)

  return (
    <ThemedModal bridge={bridge} onCancel={() => bridge.resolve()}>
      <View style={styles.titleContainer}>
        <Image style={styles.titleImage} source={edgeLogo} />
        <ModalTitle>{s.strings.update_header}</ModalTitle>
      </View>
      <ModalMessage>{message}</ModalMessage>
      <MainButton label={s.strings.update_now} marginRem={0.5} type="primary" onPress={handleUpdate} />
      <MainButton label={s.strings.update_later} marginRem={0.5} type="secondary" onPress={onSkip} />
      <ModalCloseArrow onPress={handleClose} />
    </ThemedModal>
  )
}

const getStyles = cacheStyles(theme => ({
  titleContainer: {
    alignItems: 'center',
    flexDirection: 'row'
  },
  titleImage: {
    height: theme.rem(1.75),
    margin: theme.rem(0.5),
    width: theme.rem(1.75)
  }
}))
