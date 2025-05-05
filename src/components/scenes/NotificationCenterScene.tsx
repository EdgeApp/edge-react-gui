import * as React from 'react'
import { View } from 'react-native'
import { sprintf } from 'sprintf-js'

import { showBackupModal } from '../../actions/BackupModalActions.tsx'
import { useAccountSettings, writeLocalAccountSettings } from '../../actions/LocalSettingsActions'
import { useHandler } from '../../hooks/useHandler'
import { useWatch } from '../../hooks/useWatch'
import { lstrings } from '../../locales/strings'
import { config } from '../../theme/appConfig'
import { useDispatch, useSelector } from '../../types/reactRedux'
import { EdgeAppSceneProps, NavigationBase } from '../../types/routerTypes'
import { getThemedIconUri } from '../../util/CdnUris.ts'
import { showOtpReminderModal } from '../../util/otpReminder.tsx'
import { openBrowserUri } from '../../util/WebUtils.ts'
import { SceneWrapper } from '../common/SceneWrapper'
import { SectionHeader } from '../common/SectionHeader'
import { PasswordReminderModal } from '../modals/PasswordReminderModal'
import { NotificationCenterRow } from '../notification/NotificationCenterCard'
import { Airship } from '../services/AirshipInstance'
import { updateNotificationInfo } from '../services/NotificationService.ts'
import { cacheStyles, Theme, useTheme } from '../services/ThemeContext'
import { EdgeText } from '../themed/EdgeText.tsx'

interface Props extends EdgeAppSceneProps<'notificationCenter'> {}

export const NotificationCenterScene = (props: Props) => {
  const { navigation } = props
  const theme = useTheme()
  const styles = getStyles(theme)
  const dispatch = useDispatch()
  const accountSettings = useAccountSettings()
  const { notifState, accountNotifDismissInfo } = useAccountSettings()

  const detectedTokensRedux = useSelector(state => state.core.enabledDetectedTokens)
  const account = useSelector(state => state.core.account)
  const wallets = useWatch(account, 'currencyWallets')

  const handlePasswordReminderPress = useHandler(async () => {
    // Password reminder completion state handled by the modal, if they actually
    // complete it.
    await Airship.show(bridge => <PasswordReminderModal bridge={bridge} navigation={navigation as NavigationBase} />)
  })

  const handleOtpReminderPress = useHandler(async () => {
    await showOtpReminderModal(account)
  })

  const handle2FaEnabledPress = useHandler(async () => {
    await openBrowserUri(config.ip2faSite)
    await writeLocalAccountSettings(account, { ...accountSettings, accountNotifDismissInfo: { ...accountNotifDismissInfo, ip2FaNotifShown: true } })
  })

  const handleBackupPress = useHandler(async () => {
    // Device state directly handled by `NotificationServices`
    await showBackupModal({ navigation: navigation as NavigationBase })
  })

  const pinnedNotifInfoKeys = Object.keys(notifState)
    .filter(key => notifState[key].isPriority && !notifState[key].isCompleted)
    .sort((a, b) => notifState[b].dateReceived.valueOf() - notifState[a].dateReceived.valueOf())

  const recentNotifKeys = Object.keys(notifState)
    .filter(key => !notifState[key].isPriority && !notifState[key].isCompleted)
    .sort((a, b) => notifState[b].dateReceived.valueOf() - notifState[a].dateReceived.valueOf())

  // TODO: Change state handling so animations somehow work, without relying
  // on the cards themselves to animate in/out.
  // TODO: Refactor common code between `NotificationCenterScene` and `NotificationCenterCard`
  const pinnedNotifs =
    pinnedNotifInfoKeys.length === 0 ? null : (
      <>
        <SectionHeader leftTitle={lstrings.notifications_pinned} />
        <View style={styles.divider} />

        {pinnedNotifInfoKeys.map(key => {
          const date = new Date(notifState[key].dateReceived)

          switch (key) {
            case 'pwReminder': {
              if (account.isDuressAccount) return null
              return (
                <NotificationCenterRow
                  key={key}
                  date={date}
                  type="info"
                  title={lstrings.password_reminder_card_title}
                  message={lstrings.password_reminder_card_body}
                  onPress={handlePasswordReminderPress}
                  pinned
                />
              )
            }
            case 'otpReminder': {
              if (account.isDuressAccount) return null
              return (
                <NotificationCenterRow
                  key={key}
                  date={date}
                  type="warning"
                  title={lstrings.otp_reset_modal_header}
                  message={lstrings.notif_otp_message}
                  onPress={handleOtpReminderPress}
                  pinned
                />
              )
            }
            case 'ip2FaReminder': {
              if (account.isDuressAccount) return null
              return (
                <NotificationCenterRow
                  key={key}
                  date={date}
                  type="info"
                  title={lstrings.notif_ip_validation_enabled_title}
                  message={sprintf(lstrings.notif_ip_validation_enabled_body_1s, config.appName)}
                  iconUri={getThemedIconUri(theme, 'notifications/icon-lock')}
                  onPress={handle2FaEnabledPress}
                  pinned
                />
              )
            }
            case 'lightAccountReminder': {
              return (
                <NotificationCenterRow
                  key={key}
                  date={date}
                  type="warning"
                  title={lstrings.backup_notification_title}
                  message={sprintf(lstrings.backup_notification_body, config.appName)}
                  onPress={handleBackupPress}
                  pinned
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
            await updateNotificationInfo(account, key, false)
          }

          const date = new Date(notifState[key].dateReceived)

          if (key.includes('newToken')) {
            const { params } = notifState[key]
            if (params == null) return null
            const { walletId } = params
            const { name, currencyInfo } = wallets[walletId]

            const handleCloseNewToken = async () => {
              // Since this isn't a priority notification, we can just fully
              // complete it here
              await completeNotif(key)
              dispatch({
                type: 'CORE/DISMISS_NEW_TOKENS',
                data: { walletId }
              })
            }
            const handlePressNewToken = async () => {
              await handleCloseNewToken()
              navigation.navigate('manageTokens', {
                walletId,
                newTokenIds: detectedTokensRedux[walletId]
              })
            }

            return (
              <NotificationCenterRow
                key={key}
                date={date}
                type="info"
                title={lstrings.notif_tokens_detected_title}
                message={
                  name == null || name.trim() === ''
                    ? sprintf(lstrings.notif_tokens_detected_on_address_1s, currencyInfo.currencyCode)
                    : sprintf(lstrings.notif_tokens_detected_on_wallet_name_1s, name)
                }
                onPress={handlePressNewToken}
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
      {pinnedNotifs == null && recentNotifs == null ? (
        <View style={styles.emptyContainer}>
          <EdgeText style={styles.emptyText}>{lstrings.notifications_none}</EdgeText>
        </View>
      ) : null}
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
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  emptyText: {
    fontSize: theme.rem(1.25),
    textAlign: 'center'
  }
}))
