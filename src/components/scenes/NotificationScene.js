// @flow

import { type EdgeCurrencyInfo } from 'edge-core-js'
import * as React from 'react'
import { ActivityIndicator, ScrollView } from 'react-native'

import { CryptoIcon } from '../../components/icons/CryptoIcon.js'
import { useHandler } from '../../hooks/useHandler.js'
import { useWatch } from '../../hooks/useWatch.js'
import s from '../../locales/strings'
import { notif1 } from '../../modules/notifServer.js'
import { getActiveWalletCurrencyInfos } from '../../selectors/WalletSelectors.js'
import { useEffect, useState } from '../../types/reactHooks.js'
import { useSelector } from '../../types/reactRedux.js'
import { type NavigationProp } from '../../types/routerTypes.js'
import { SceneWrapper } from '../common/SceneWrapper.js'
import { showError } from '../services/AirshipInstance.js'
import { type Theme, cacheStyles, useTheme } from '../services/ThemeContext.js'
import { SettingsSwitchRow } from '../themed/SettingsSwitchRow.js'
import { SettingsTappableRow } from '../themed/SettingsTappableRow.js'

type OwnProps = {
  navigation: NavigationProp<'notificationSettings'>
}

type Props = OwnProps

export const NotificationScene = (props: Props) => {
  const { navigation } = props
  const theme = useTheme()
  const styles = getStyles(theme)

  const [enabled, setEnabled] = useState(true)
  const [loading, setLoading] = useState(false)

  const account = useSelector(state => state.core.account)
  const userId = account.rootLoginId

  const encodedUserId = encodeURIComponent(userId)
  const currencyWallets = useWatch(account, 'currencyWallets')
  const currencyInfos = getActiveWalletCurrencyInfos(currencyWallets)

  useEffect(() => {
    setLoading(true)

    notif1
      .get(`/user?userId=${encodedUserId}`)
      .then(result => {
        setEnabled(result.notifications.enabled)
        setLoading(false)
      })
      .catch(error => {
        showError(error)
        console.log(error)
        setLoading(false)
      })
  }, [encodedUserId])

  const toggleNotifications = useHandler(() => {
    notif1
      .post(`user/notifications/toggle?userId=${encodedUserId}`, { enabled: !enabled })
      .then(() => {
        setEnabled(!enabled)
        global.logActivity(`Set Notifications: ${userId} -- enabled=${enabled.toString()}}`)
      })
      .catch(error => {
        showError(error)
        console.log(error)
      })
  })

  return (
    <SceneWrapper background="theme" hasTabs={false}>
      {loading ? (
        <ActivityIndicator color={theme.primaryText} style={styles.loader} size="large" />
      ) : (
        <ScrollView>
          <SettingsSwitchRow label={s.strings.settings_notifications_switch} value={enabled} onPress={toggleNotifications} />
          {currencyInfos.map((currencyInfo: EdgeCurrencyInfo) => {
            const { displayName, pluginId } = currencyInfo
            const onPress = () =>
              enabled
                ? navigation.navigate('currencyNotificationSettings', {
                    currencyInfo
                  })
                : undefined

            return (
              <SettingsTappableRow disabled={!enabled} key={pluginId} label={displayName} onPress={onPress}>
                <CryptoIcon pluginId={pluginId} />
              </SettingsTappableRow>
            )
          })}
        </ScrollView>
      )}
    </SceneWrapper>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  currencyLogo: {
    height: theme.rem(1.25),
    width: theme.rem(1.25),
    marginHorizontal: theme.rem(0.5),
    resizeMode: 'contain'
  },
  loader: {
    flex: 1,
    alignSelf: 'center'
  }
}))
