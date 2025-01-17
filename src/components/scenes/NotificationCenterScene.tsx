import * as React from 'react'
import { View } from 'react-native'
import { sprintf } from 'sprintf-js'

import { getDeviceSettings, writeDeviceNotifInfo } from '../../actions/DeviceSettingsActions'
import { useHandler } from '../../hooks/useHandler'
import { useWatch } from '../../hooks/useWatch'
import { lstrings } from '../../locales/strings'
import { config } from '../../theme/appConfig'
import { useSelector } from '../../types/reactRedux'
import { EdgeAppSceneProps, NavigationBase } from '../../types/routerTypes'
import { EdgeAnim, fadeIn, fadeOut } from '../common/EdgeAnim'
import { SceneWrapper } from '../common/SceneWrapper'
import { SectionHeader } from '../common/SectionHeader'
import { PasswordReminderModal } from '../modals/PasswordReminderModal'
import { NotificationCenterRow } from '../notification/NotificationCenterCard'
import { Airship } from '../services/AirshipInstance'
import { cacheStyles, Theme, useTheme } from '../services/ThemeContext'

interface Props extends EdgeAppSceneProps<'notificationCenter'> {}

export const NotificationCenterScene = (props: Props) => {
  const { navigation } = props
  const theme = useTheme()
  const styles = getStyles(theme)

  const detectedTokensRedux = useSelector(state => state.core.enabledDetectedTokens)
  const account = useSelector(state => state.core.account)
  const wallets = useWatch(account, 'currencyWallets')

  const { deviceNotifState } = getDeviceSettings()

  const pinnedNotifInfoKeys = Object.keys(deviceNotifState)
    .filter(key => deviceNotifState[key].isPriority && !deviceNotifState[key].isCompleted)
    .sort((a, b) => deviceNotifState[b].dateReceived - deviceNotifState[a].dateReceived)

  const recentNotifKeys = Object.keys(deviceNotifState)
    .filter(key => !deviceNotifState[key].isPriority && !deviceNotifState[key].isCompleted)
    .sort((a, b) => deviceNotifState[b].dateReceived - deviceNotifState[a].dateReceived)

  const handlePasswordReminderPress = useHandler(async () => {
    await Airship.show(bridge => <PasswordReminderModal bridge={bridge} navigation={navigation as NavigationBase} postponeOnCancel={false} />)
  })

  const pinnedNotifs =
    pinnedNotifInfoKeys.length === 0 ? null : (
      <>
        <SectionHeader leftTitle={lstrings.notifications_pinned} />
        <View style={styles.divider} />

        {pinnedNotifInfoKeys.map(key => {
          switch (key) {
            case 'pwReminder': {
              return (
                <EdgeAnim visible={deviceNotifState.pwReminder != null && !deviceNotifState.pwReminder.isCompleted} enter={fadeIn} exit={fadeOut}>
                  <NotificationCenterRow
                    key={key}
                    type="info"
                    title={lstrings.password_reminder_card_title}
                    message={lstrings.password_reminder_card_body}
                    onPress={handlePasswordReminderPress}
                  />
                </EdgeAnim>
              )
            }
            case 'otpReminder': {
              return (
                <NotificationCenterRow
                  key={key}
                  type="warning"
                  title={lstrings.otp_reset_modal_header}
                  message={lstrings.notif_otp_message}
                  onPress={handlePasswordReminderPress}
                />
              )
            }
            case 'ip2FaReminder': {
              return (
                <NotificationCenterRow
                  key={key}
                  type="info"
                  title={lstrings.notif_ip_validation_enabled_title}
                  message={sprintf(lstrings.notif_ip_validation_enabled_body_1s, config.appName)}
                  onPress={handlePasswordReminderPress}
                />
              )
            }
            default:
              return null
          }
        })}
      </>
    )

  const recentNotifs =
    recentNotifKeys.length === 0 ? null : (
      <>
        <SectionHeader leftTitle={lstrings.notifications_recent} />
        <View style={styles.divider} />
        {recentNotifKeys.map(key => {
          const completeNotif = (key: string) => async () => {
            await writeDeviceNotifInfo(key, { isCompleted: true, isBannerHidden: true })
          }

          if (key.includes('newToken')) {
            if (deviceNotifState[key].params == null) return null
            const { walletId } = deviceNotifState[key].params
            const { name, currencyInfo } = wallets[walletId]

            return (
              <NotificationCenterRow
                key={key}
                type="info"
                title={lstrings.notif_tokens_detected_title}
                message={
                  name == null || name.trim() === ''
                    ? sprintf(lstrings.notif_tokens_detected_on_address_1s, currencyInfo.currencyCode)
                    : sprintf(lstrings.notif_tokens_detected_on_wallet_name_1s, name)
                }
                onPress={() =>
                  navigation.navigate('manageTokens', {
                    walletId,
                    newTokenIds: detectedTokensRedux[walletId]
                  })
                }
                onClose={completeNotif(key)}
              />
            )
          } else {
            // Not implemented
            return null
          }
        })}
      </>
    )

  return (
    <SceneWrapper>
      {pinnedNotifs}
      {recentNotifs}
    </SceneWrapper>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  divider: {
    height: theme.thinLineWidth,
    borderBottomWidth: theme.thinLineWidth,
    borderBottomColor: theme.lineDivider,
    marginLeft: theme.rem(1.5),
    marginVertical: theme.rem(0.5)
  }
}))
