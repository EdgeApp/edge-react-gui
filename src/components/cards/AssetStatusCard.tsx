import { AssetStatus } from 'edge-info-server'
import * as React from 'react'
import IonIcon from 'react-native-vector-icons/Ionicons'

import { getLocaleOrDefaultString } from '../../locales/intl'
import { openBrowserUri } from '../../util/WebUtils'
import { cacheStyles, Theme, useTheme } from '../services/ThemeContext'
import { IconMessageCard } from './IconMessageCard'
export const AssetStatusCard = (props: { assetStatus: AssetStatus }) => {
  const { statusType, localeStatusTitle, localeStatusBody, iconUrl, statusUrl } = props.assetStatus
  const theme = useTheme()
  const styles = getStyles(theme)

  const title = getLocaleOrDefaultString(localeStatusTitle)
  const message = getLocaleOrDefaultString(localeStatusBody)
  const isValidText = title != null && message != null

  return isValidText ? (
    <IconMessageCard
      message={message}
      title={title}
      testIds={{ title: 'statusCardTitle', message: 'statusCardMessage', close: 'statusCardClose' }}
      iconOrUri={
        // If not explicitly set, auto-fill if warning status.
        iconUrl == null ? (
          statusType === 'warning' ? (
            <IonIcon name="warning-outline" style={styles.icon} color={theme.warningText} size={theme.rem(3)} />
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
    marginRight: theme.rem(0.5)
  }
}))
