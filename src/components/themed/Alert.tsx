import * as React from 'react'
import { Platform, TouchableOpacity, View } from 'react-native'
import IonIcon from 'react-native-vector-icons/Ionicons'

import { useHandler } from '../../hooks/useHandler'
import { fixSides, mapSides, sidesToMargin, sidesToPadding } from '../../util/sides'
import { showError } from '../services/AirshipInstance'
import { cacheStyles, Theme, useTheme } from '../services/ThemeContext'
import { EdgeText } from '../themed/EdgeText'

type AlertType = 'info' | 'warning' | 'error' | 'success'

interface Props {
  children?: React.ReactNode
  marginRem?: number[] | number
  message?: string
  numberOfLines?: number
  paddingRem?: number[] | number
  title: string
  type: AlertType
  onPress?: () => Promise<void> | void
}

export function Alert(props: Props) {
  const { children, marginRem, message, numberOfLines = 2, paddingRem, title, type, onPress } = props
  const theme = useTheme()
  const styles = getStyles(theme)

  const margin = sidesToMargin(mapSides(fixSides(marginRem, 1), theme.rem))
  const padding = sidesToPadding(mapSides(fixSides(paddingRem, 1), theme.rem))

  const typeColor = type === 'warning' ? theme.warningText : type === 'error' ? theme.dangerText : theme.primaryText

  const handlePress = useHandler(() => {
    if (onPress != null) onPress()?.catch(err => showError(err))
  })

  const result = (
    <View style={[styles.alert, margin, padding, { borderColor: typeColor }]}>
      <View style={styles.header}>
        {type !== 'error' ? null : (
          <IonIcon
            color={typeColor}
            name={Platform.OS === 'ios' ? 'ios-information-circle-outline' : 'md-information-circle-outline'}
            size={theme.rem(1.25)}
            style={styles.icon}
          />
        )}
        <EdgeText style={[styles.title, { color: typeColor }]}>{title}</EdgeText>
      </View>
      {message == null ? null : (
        <EdgeText style={[styles.message, { color: typeColor }]} numberOfLines={numberOfLines}>
          {message}
        </EdgeText>
      )}
      {children}
    </View>
  )

  return onPress ? <TouchableOpacity onPress={handlePress}>{result}</TouchableOpacity> : result
}

const getStyles = cacheStyles((theme: Theme) => ({
  alert: {
    borderWidth: theme.cardBorder,
    borderRadius: theme.cardBorderRadius,
    alignSelf: 'stretch'
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  title: {
    fontSize: theme.rem(0.75)
  },
  icon: {
    marginRight: theme.rem(0.5)
  },
  message: {
    fontSize: theme.rem(0.75)
  }
}))
