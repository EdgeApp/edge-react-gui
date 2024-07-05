import * as React from 'react'
import { View } from 'react-native'
import IonIcon from 'react-native-vector-icons/Ionicons'

import { cacheStyles, Theme, useTheme } from '../services/ThemeContext'
import { EdgeText } from '../themed/EdgeText'
import { EdgeCard } from './EdgeCard'

interface Props {
  body?: string[] | string // Bullet point messages if an array is provided
  title: string
  type: 'error' | 'warning'
  footer?: string
  header?: string

  // DO NOT USE after a scene is fully UI4! Margins should all align without adjustment.
  marginRem?: number[] | number

  onPress?: () => void
}
/**
 * A warning or error card that accepts a title, header, bullet points OR normal
 * message, and a footer. The body is considered bullet pointed if an array of
 * strings is given.
 * Bullet points, if provided, are rendered with the correct vertical alignment when
 * the messages overflow.
 *  .___________________________.
 *  | ⚠ Title Text              |
 *  |                           |
 *  | This is the header text   |
 *  |                           |
 *  | • This is an overflowing  |
 *  |   bulletpoint message     |
 *  | • This one's short        |
 *  |                           |
 *  | This is the footer text   |
 *  |___________________________|
 */
export function AlertCardUi4(props: Props) {
  const { title, type, header, body, footer, marginRem, onPress } = props
  const theme = useTheme()
  const styles = getStyles(theme)

  const bulletPoint = (bulletPoint: string) => {
    return (
      <View style={styles.bulletpointRow} key={bulletPoint}>
        <EdgeText style={styles.bulletpointText}>{'\u2022 '}</EdgeText>
        <EdgeText style={styles.bulletpointText} numberOfLines={0}>
          {bulletPoint}
        </EdgeText>
      </View>
    )
  }

  return (
    <EdgeCard gradientBackground={type === 'error' ? theme.cardGradientError : theme.cardGradientWarning} marginRem={marginRem} onPress={onPress}>
      <View style={styles.container}>
        <View style={styles.titleContainer}>
          <IonIcon name="warning-outline" style={styles.icon} color={theme.primaryText} size={theme.rem(1.25)} />
          <EdgeText numberOfLines={0} style={styles.titleText}>
            {title}
          </EdgeText>
        </View>

        {header == null ? null : <EdgeText style={styles.text}>{header}</EdgeText>}

        {body == null ? null : typeof body === 'object' && body.length > 0 ? (
          <View style={styles.bulletPointContainer}>{body.map(point => bulletPoint(point))}</View>
        ) : (
          <EdgeText style={styles.text} numberOfLines={10}>
            {body}
          </EdgeText>
        )}

        {footer == null ? null : (
          <EdgeText style={styles.text} numberOfLines={10}>
            {footer}
          </EdgeText>
        )}
      </View>
    </EdgeCard>
  )
}

const getStyles = (theme: Theme) =>
  cacheStyles((theme: Theme) => ({
    container: {
      margin: theme.rem(0.5)
    },
    titleContainer: {
      flexDirection: 'row',
      alignItems: 'center'
    },
    titleText: {
      marginLeft: theme.rem(0.2),
      fontFamily: theme.fontFaceMedium,
      flexShrink: 1
    },
    icon: {
      marginRight: theme.rem(0.2)
    },
    text: {
      fontSize: theme.rem(0.75),
      marginHorizontal: theme.rem(0.25),
      marginTop: theme.rem(0.5)
    },
    bulletPointContainer: {
      marginTop: theme.rem(0.5)
    },
    bulletpointRow: {
      flexDirection: 'row'
    },
    bulletpointText: {
      marginLeft: theme.rem(0.2),
      fontSize: theme.rem(0.75)
    }
  }))(theme)
