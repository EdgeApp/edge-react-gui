import { useRoute } from '@react-navigation/native'
import * as React from 'react'

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
    <>
      <CryptoIcon marginRem={[0, 0.5, 0, 0]} pluginId={pluginId} sizeRem={1.25} />
      <EdgeText style={styles.text}>{displayName}</EdgeText>
    </>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  text: {
    fontFamily: theme.fontFaceMedium
  }
}))
