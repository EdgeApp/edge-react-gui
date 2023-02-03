import * as React from 'react'
import { View } from 'react-native'
import { AirshipBridge } from 'react-native-airship'

import { cacheStyles, Theme, useTheme } from '../services/ThemeContext'
import { EdgeText } from '../themed/EdgeText'
import { AirshipDropdown } from './AirshipDropdown'

interface Props {
  bridge: AirshipBridge<void>
  message: string
}

export const TextDropdown = ({ bridge, message }: Props) => {
  const theme = useTheme()
  const styles = getStyles(theme)
  return (
    <AirshipDropdown bridge={bridge} backgroundColor={theme.modal}>
      <View style={styles.container}>
        <EdgeText>{message}</EdgeText>
      </View>
    </AirshipDropdown>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  container: {
    height: theme.rem(4),
    justifyContent: 'center',
    alignItems: 'center'
  }
}))
