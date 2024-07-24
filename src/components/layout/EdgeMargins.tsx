import * as React from 'react'
import { View } from 'react-native'

import { cacheStyles, Theme, useTheme } from '../services/ThemeContext'

interface Props {
  children: React.ReactNode
  shrink?: boolean
}

/** @deprecated Simple View to apply 0.5rem margins to make legacy components easier to adapt to UI4 */
export const EdgeMargins = (props: Props) => {
  const theme = useTheme()
  const styles = getStyles(theme)
  const { shrink = false, children } = props

  return <View style={[styles.margin, !shrink && styles.grow]}>{children}</View>
}

const getStyles = cacheStyles((theme: Theme) => ({
  margin: {
    margin: theme.rem(0.5)
  },
  grow: {
    flexGrow: 1
  }
}))
