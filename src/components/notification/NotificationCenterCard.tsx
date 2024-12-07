import * as React from 'react'
import { View } from 'react-native'
import { cacheStyles } from 'react-native-patina'

import { getThemedIconUri } from '../../util/CdnUris'
import { Theme, useTheme } from '../services/ThemeContext'
import { NotificationCard } from './NotificationCard'

interface Props {
  message: string
  title: string
  type: 'warning' | 'info'
  isComplete: boolean
  iconUri?: string

  onPress: () => void | Promise<void>
}

export const NotificationCenterCard = (props: Props) => {
  const theme = useTheme()
  const styles = getStyles(theme)

  const { title, type, message, isComplete, onPress } = props
  const { iconUri = type === 'warning' ? getThemedIconUri(theme, 'notifications/icon-warning') : getThemedIconUri(theme, 'notifications/icon-info') } = props

  return (
    <View style={styles.container}>
      <View style={[styles.dot, isComplete ? styles.noDot : null]} />
      <NotificationCard message={message} title={title} type={type} iconUri={iconUri} onPress={onPress} />
    </View>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  container: {
    flexDirection: 'row',
    flexShrink: 1,
    flexGrow: 1
  },
  dot: {
    width: theme.rem(0.75),
    height: theme.rem(0.75),
    backgroundColor: 'red'
  },
  noDot: {
    backgroundColor: 'transparent'
  }
}))
