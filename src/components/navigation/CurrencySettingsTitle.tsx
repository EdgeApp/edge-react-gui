import { useRoute } from '@react-navigation/native'
import * as React from 'react'
import { View } from 'react-native'

import { RouteProp } from '../../types/routerTypes'
import { CryptoIcon } from '../icons/CryptoIcon'
import { cacheStyles, Theme, useTheme } from '../services/ThemeContext'
import { EdgeText } from '../themed/EdgeText'

export function CurrencySettingsTitle() {
  const route = useRoute<RouteProp<'currencySettings' | 'currencyNotificationSettings'>>()
  const { currencyInfo } = route.params
  const { displayName, pluginId } = currencyInfo

  const styles = getStyles(useTheme())
  return (
    <View style={styles.container}>
      <CryptoIcon marginRem={iconPadding} pluginId={pluginId} sizeRem={1.25} />
      <EdgeText style={styles.text}>{displayName}</EdgeText>
    </View>
  )
}

const iconPadding = [0, 0.5, 0, 0]

const getStyles = cacheStyles((theme: Theme) => ({
  container: {
    alignItems: 'center',
    flexDirection: 'row',
    flexGrow: 1,
    justifyContent: 'center'
  },
  text: {
    fontFamily: theme.fontFaceMedium
  }
}))
