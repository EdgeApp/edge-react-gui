import * as React from 'react'
import { Platform, View } from 'react-native'
import IonIcon from 'react-native-vector-icons/Ionicons'

import { fixSides, mapSides, sidesToMargin, sidesToPadding } from '../../util/sides'
import { cacheStyles, Theme, useTheme } from '../services/ThemeContext'
import { EdgeText } from '../themed/EdgeText'

interface Props {
  title: string
  header?: string | null
  points?: string[] | null
  footer?: string | null
  marginRem?: number[] | number
  paddingRem?: number[] | number
}
/**
 * A warning card that accepts a title, header, bullet points and a footer,
 * rendering the bullet points with the correct vertical alignment when
 * the messages overflow.
 *  .___________________________.
 *  | ⚠ Warning                 |
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
export function WarningCard({ title, header, points, footer, marginRem, paddingRem }: Props) {
  const theme = useTheme()
  const margin = sidesToMargin(mapSides(fixSides(marginRem, 1), theme.rem))
  const padding = sidesToPadding(mapSides(fixSides(paddingRem, 1), theme.rem))

  const styles = getStyles(theme)

  const renderBulletpoint = (message: string) => {
    return (
      <View style={styles.bulletpointRow} key={message}>
        <EdgeText style={styles.bulletpointText}>{'\u2022 '}</EdgeText>
        <EdgeText style={styles.bulletpointText} numberOfLines={0}>
          {message}
        </EdgeText>
      </View>
    )
  }
  return (
    <View style={[styles.warning, margin, padding]}>
      <View style={styles.titleContainer}>
        <IonIcon
          name={Platform.OS === 'ios' ? 'ios-warning-outline' : 'md-warning-outline'}
          style={styles.icon}
          color={theme.warningText}
          size={theme.rem(0.8)}
        />
        <EdgeText style={styles.title}>{title}</EdgeText>
      </View>
      {header != null && (
        <EdgeText style={styles.text} numberOfLines={0}>
          {header}
        </EdgeText>
      )}
      {points != null && points.length > 0 && <View style={styles.bulletpoints}>{points?.map(point => renderBulletpoint(point))}</View>}
      {footer != null && (
        <EdgeText style={styles.text} numberOfLines={0}>
          {footer}
        </EdgeText>
      )}
    </View>
  )
}

const getStyles = (theme: Theme) =>
  cacheStyles((theme: Theme) => ({
    warning: {
      borderWidth: theme.cardBorder,
      borderColor: theme.warningText,
      borderRadius: theme.cardBorderRadius,
      margin: theme.rem(1),
      alignSelf: 'stretch'
    },
    titleContainer: {
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'center'
    },
    title: {
      fontSize: theme.rem(0.75),
      marginLeft: theme.rem(0.25),
      fontFamily: theme.fontFaceBold,
      color: theme.warningText
    },
    icon: {
      marginRight: theme.rem(0.5)
    },
    text: {
      fontSize: theme.rem(0.75),
      marginTop: theme.rem(1),
      fontFamily: theme.fontFaceDefault,
      color: theme.warningText
    },
    bulletpoints: {
      marginTop: theme.rem(0.5)
    },
    bulletpointRow: {
      flexDirection: 'row'
    },
    bulletpointText: {
      marginLeft: theme.rem(0.2),
      fontSize: theme.rem(0.75),
      color: theme.warningText,
      fontFamily: theme.fontFaceDefault
    }
  }))(theme)
