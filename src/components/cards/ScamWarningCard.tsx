import * as React from 'react'
import { Platform, View } from 'react-native'
import IonIcon from 'react-native-vector-icons/Ionicons'

import s from '../../locales/strings'
import { fixSides, mapSides, sidesToMargin, sidesToPadding } from '../../util/sides'
import { cacheStyles, Theme, useTheme } from '../services/ThemeContext'
import { EdgeText } from '../themed/EdgeText'

type Props = {
  marginRem?: number[] | number
  paddingRem?: number[] | number
}
export function ScamWarningCard({ marginRem, paddingRem }: Props) {
  const theme = useTheme()
  const margin = sidesToMargin(mapSides(fixSides(marginRem, 1), theme.rem))
  const padding = sidesToPadding(mapSides(fixSides(paddingRem, 1), theme.rem))

  const styles = getStyles(theme)

  const renderBulletpoint = (message: string) => {
    return (
      <View style={styles.bulletpointRow}>
        <EdgeText style={styles.bulletpointText}>{'\u2022 '}</EdgeText>
        <EdgeText style={styles.bulletpointText} numberOfLines={0}>
          {message}
        </EdgeText>
      </View>
    )
  }
  return (
    <View style={[styles.warning, margin, padding]}>
      <View style={styles.header}>
        <IonIcon
          name={Platform.OS === 'ios' ? 'ios-warning-outline' : 'md-warning-outline'}
          style={styles.icon}
          color={theme.warningText}
          size={theme.rem(0.8)}
        />
        <EdgeText style={styles.title}>{s.strings.warning_scam_title}</EdgeText>
      </View>
      <View style={styles.bulletpoints}>
        {renderBulletpoint(s.strings.warning_scam_message_financial_advice)}
        {renderBulletpoint(s.strings.warning_scam_message_irreversibility)}
        {renderBulletpoint(s.strings.warning_scam_message_unknown_recipients)}
      </View>
      <EdgeText style={styles.footer} numberOfLines={0}>
        {s.strings.warning_scam_footer}
      </EdgeText>
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
    header: {
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
    footer: {
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
