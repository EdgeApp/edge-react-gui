// @flow

import * as React from 'react'
import { Dimensions, View } from 'react-native'
import { type AirshipBridge } from 'react-native-airship'

import { type Theme, cacheStyles, useTheme } from '../services/ThemeContext'
import { ThemedModal } from '../themed/ThemedModal'

type Props = {
  children: React.Node,
  bridge: AirshipBridge<boolean>
}

export function CenteredModal({ children, bridge }: Props) {
  const theme = useTheme()
  const styles = getStyles(theme)

  return (
    <ThemedModal bridge={bridge} position="center" onCancel={() => bridge.resolve(false)}>
      <View style={styles.container}>{children}</View>
    </ThemedModal>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  container: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').width
  }
}))
