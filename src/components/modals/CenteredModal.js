// @flow

import * as React from 'react'
import { Dimensions, View } from 'react-native'
import { type AirshipBridge } from 'react-native-airship'
import { isTablet } from 'react-native-device-info'

import { type Theme, cacheStyles, useTheme } from '../services/ThemeContext'
import { ThemedModal } from '../themed/ThemedModal'

const CONTENT_MAX_WIDTH = Dimensions.get('window').width

const getContentWidth = (theme: Theme) => (isTablet() ? CONTENT_MAX_WIDTH - theme.rem(2) : CONTENT_MAX_WIDTH)

type Props = {
  children: React.Node,
  bridge: AirshipBridge<boolean>
}

export function CenteredModal({ children, bridge }: Props) {
  const theme = useTheme()
  const styles = getStyles(theme)

  return (
    <ThemedModal bridge={bridge} position="center" maxWidth={getContentWidth(theme)} onCancel={() => bridge.resolve(false)}>
      <View style={styles.container}>{children}</View>
    </ThemedModal>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  container: {
    width: getContentWidth(theme),
    height: getContentWidth(theme)
  }
}))
