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
      <CryptoIcon marginRem={[0, 0.5, 0, 0]} pluginId={pluginId} sizeRem={1.25} />
      <EdgeText style={styles.text}>{displayName}</EdgeText>
    </View>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  container: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.rem(0.75)
  },
  text: {
    fontFamily: theme.fontFaceMedium
  }
}))
