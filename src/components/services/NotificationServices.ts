import { getDeviceSettings, writeDeviceNotifInfo } from '../../actions/DeviceSettingsActions'
import { getLocalAccountSettings } from '../../actions/LocalSettingsActions'
import { useAsyncEffect } from '../../hooks/useAsyncEffect'
import { useWatch } from '../../hooks/useWatch'
import { useSelector } from '../../types/reactRedux'
import { getOtpReminderModal } from '../../util/otpReminder'

/**
 * Checks for new notifications that have not yet been saved to `deviceNotifications`
 */
export const NotificationServices = () => {
  const { deviceNotifState } = getDeviceSettings()
  const accountNotifDismissInfo = getLocalAccountSettings().accountNotifDismissInfo

  const account = useSelector(state => state.core.account)
  const isLightAccountReminder = account.id != null && account.username == null
  const detectedTokensRedux = useSelector(state => state.core.enabledDetectedTokens)
  const isPwReminder = useSelector(state => state.ui.passwordReminder.needsPasswordCheck)

  const wallets = useWatch(account, 'currencyWallets')
  const otpKey = useWatch(account, 'otpKey')

  // Either create new notification info or update the completed notification
  // info with the latest date received
  useAsyncEffect(
    async () => {
      // New token(s) detected
      Object.keys(wallets).forEach(async walletId => {
        const newTokenKey = `newToken-${walletId}`
        const newTokenIds = detectedTokensRedux[walletId]

        if (newTokenIds != null && newTokenIds.length > 0 && deviceNotifState[newTokenKey] == null) {
          // Only happens once per notification info key.
          await writeDeviceNotifInfo(newTokenKey, {
            dateReceived: Date.now(),
            isPriority: true,
            isCompleted: false,
            params: { walletId }
          })
        }
      })

      // 2FA/OTP Reminder
      const isOtpReminder = (await getOtpReminderModal(account)) != null
      const isOtpReminderStale = deviceNotifState.otpReminder == null || deviceNotifState.otpReminder.isCompleted
      if (isOtpReminder && isOtpReminderStale) {
        await writeDeviceNotifInfo('otpReminder', {
          dateReceived: Date.now(),
          isPriority: true,
          isCompleted: false
        })
      }

      // PW Reminder
      if (isPwReminder) {
        await writeDeviceNotifInfo('pwReminder', {
          dateReceived: Date.now(),
          isPriority: true,
          isCompleted: false
        })
      }

      // Light Account Backup
      if (isLightAccountReminder) {
        await writeDeviceNotifInfo('lightAccountReminder', {
          dateReceived: Date.now(),
          isBannerHidden: false, // Always show this in NotificationView on login
          isPriority: true,
          isCompleted: false
        })
      }

      // IP 2FA
      const isIp2FaReminder = !isLightAccountReminder && otpKey == null && accountNotifDismissInfo != null && !accountNotifDismissInfo.ip2FaNotifShown
      if (isIp2FaReminder) {
        await writeDeviceNotifInfo('ip2FaReminder', {
          dateReceived: Date.now(),
          isPriority: true,
          isCompleted: false
        })
      }

      // cleanup:
      return () => {}
    },
    [account, accountNotifDismissInfo, detectedTokensRedux, deviceNotifState, otpKey, wallets],
    'NotificationServices'
  )

  return null
}
