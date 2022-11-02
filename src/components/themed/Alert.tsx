import * as React from 'react'
import { Platform, TouchableOpacity, View, ViewStyle } from 'react-native'
import IonIcon from 'react-native-vector-icons/Ionicons'

import { fixSides, mapSides, sidesToMargin, sidesToPadding } from '../../util/sides'
import { cacheStyles, Theme, useTheme } from '../services/ThemeContext'
import { EdgeText } from '../themed/EdgeText'

type AlerType = 'info' | 'warning' | 'error' | 'success'

interface Props {
  type: AlerType
  title: string
  message?: string
  numberOfLines?: number
  children?: React.ReactNode
  marginRem?: number[] | number
  paddingRem?: number[] | number
  onPress?: () => void
}

interface StylesOptions {
  typeColor: string
}

// TODO: Implement alert colors such as info and others
export const useAlertTypeColor = (type: AlerType) => {
  const theme = useTheme()

  switch (type) {
    case 'warning':
      return theme.warningText
    case 'error':
      return theme.dangerText
    default:
      return theme.primaryText
  }
}

// TODO: Implement alert icons such as info and others
export const useAlertTypeIcon = (type: AlerType, color: string, size: number, style: ViewStyle) => {
  switch (type) {
    case 'warning':
    case 'error':
      return (
        <IonIcon style={style} name={Platform.OS === 'ios' ? 'ios-information-circle-outline' : 'md-information-circle-outline'} color={color} size={size} />
      )
    default:
      return null
  }
}

export function Alert({ type, title, message, numberOfLines = 2, marginRem, paddingRem, onPress, children }: Props) {
  const theme = useTheme()
  const margin = sidesToMargin(mapSides(fixSides(marginRem, 1), theme.rem))
  const padding = sidesToPadding(mapSides(fixSides(paddingRem, 1), theme.rem))

  const typeColor = useAlertTypeColor(type)

  const styles = getStyles(theme, { typeColor })

  const icon = useAlertTypeIcon(type, typeColor, theme.rem(1.25), styles.icon)

  const result = (
    <View style={[styles.alert, margin, padding]}>
      <View style={styles.header}>
        {icon}
        <EdgeText style={styles.title}>{title}</EdgeText>
      </View>
      {message && (
        <EdgeText style={styles.message} numberOfLines={numberOfLines}>
          {message}
        </EdgeText>
      )}
      {children}
    </View>
  )

  return onPress ? <TouchableOpacity onPress={onPress}>{result}</TouchableOpacity> : result
}

const getStyles = (theme: Theme, { typeColor }: StylesOptions) =>
  cacheStyles((theme: Theme) => ({
    alert: {
      borderWidth: theme.cardBorder,
      borderColor: typeColor,
      borderRadius: theme.cardBorderRadius,
      alignSelf: 'stretch'
    },
    header: {
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'center'
    },
    title: {
      fontSize: theme.rem(0.75),
      color: typeColor
    },
    icon: {
      marginRight: theme.rem(0.5)
    },
    message: {
      fontSize: theme.rem(0.75),
      color: typeColor,
      fontFamily: theme.fontFaceDefault
    }
  }))(theme)
