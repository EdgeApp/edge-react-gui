import { AssetStatus } from 'edge-info-server/types'
import * as React from 'react'
import { Platform } from 'react-native'
import { getLocales } from 'react-native-localize'
import IonIcon from 'react-native-vector-icons/Ionicons'

import { pickLanguage } from '../../locales/intl'
import { openBrowserUri } from '../../util/WebUtils'
import { cacheStyles, Theme, useTheme } from '../services/ThemeContext'
import { StatusCard } from './StatusCard'

export const AssetStatusCard = (props: { assetStatus: AssetStatus }) => {
  const { statusType, localeStatusTitle, localeStatusBody, iconUrl, statusUrl, statusStartIsoDate, statusEndIsoDate } = props.assetStatus
  const theme = useTheme()
  const styles = getStyles(theme)

  const curDate = new Date().toISOString()
  const isWithinDate = statusStartIsoDate != null && statusEndIsoDate != null && statusStartIsoDate <= curDate && statusEndIsoDate >= curDate

  const [firstLocale = { languageTag: 'en_US' }] = getLocales()
  const { languageTag } = firstLocale
  const titleLocale = pickLanguage(languageTag, Object.keys(localeStatusTitle))
  const messageLocale = pickLanguage(languageTag, Object.keys(localeStatusBody))
  const title = localeStatusTitle[titleLocale ?? 0]
  const message = localeStatusBody[messageLocale ?? 0]

  return isWithinDate ? (
    <StatusCard
      message={message}
      title={title}
      iconOrUri={
        // If not explicitly set, auto-fill if warning status.
        iconUrl == null ? (
          statusType === 'warning' ? (
            <IonIcon
              name={Platform.OS === 'ios' ? 'ios-warning-outline' : 'md-warning-outline'}
              style={styles.icon}
              color={theme.warningText}
              size={theme.rem(3)}
            />
          ) : (
            // statusType === 'info'
            <IonIcon name="information-circle-outline" size={theme.rem(1.25)} color={theme.warningText} />
          )
        ) : (
          iconUrl
        )
      }
      onPress={statusUrl ? () => openBrowserUri(statusUrl) : undefined}
    />
  ) : null
}

const getStyles = cacheStyles((theme: Theme) => ({
  icon: {
    width: theme.rem(3),
    height: theme.rem(3),
    marginRight: theme.rem(0.75),
    marginLeft: theme.rem(-0.25)
  }
}))
