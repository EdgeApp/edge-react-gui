// import * as React from 'react'

import { createDeviceNotifInfo, getDeviceSettings } from '../../actions/DeviceSettingsActions'
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
          // Don't need to update existing, only create new ones with the
          // default props.
          await createDeviceNotifInfo(newTokenKey)
        }
      })

      // 2FA/OTP Reminder
      const isOtpReminder = (await getOtpReminderModal(account)) != null
      const isOtpReminderStale = deviceNotifState.otpReminder == null || deviceNotifState.otpReminder.isCompleted
      if (isOtpReminder && isOtpReminderStale) {
        await createDeviceNotifInfo('otpReminder', {
          isPriority: true
        })
      }

      // PW Reminder
      const isPwReminderStale = deviceNotifState.pwReminder == null || deviceNotifState.pwReminder.isCompleted
      if (isPwReminder && isPwReminderStale) {
        await createDeviceNotifInfo('pwReminder', {
          isPriority: true
        })
      }

      // Light Account Backup
      const isLightAccountStale = deviceNotifState.lightAccount == null || deviceNotifState.lightAccount.isCompleted
      if (isLightAccountReminder && isLightAccountStale) {
        await createDeviceNotifInfo('lightAccountReminder', {
          isPriority: true
        })
      }

      // IP 2FA
      const isIp2FaReminder = !isLightAccountReminder && otpKey == null && accountNotifDismissInfo != null && !accountNotifDismissInfo.ip2FaNotifShown
      const isIp2FaStale = deviceNotifState.ip2FaReminder == null || deviceNotifState.ip2FaReminder.isCompleted
      if (isIp2FaReminder && isIp2FaStale) {
        await createDeviceNotifInfo('ip2FaReminder', {
          isPriority: true
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
