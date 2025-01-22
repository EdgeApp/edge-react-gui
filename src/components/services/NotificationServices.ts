import { EdgeAccount } from 'edge-core-js'

import { getLocalAccountSettings, writeAccountNotifInfo } from '../../actions/LocalSettingsActions'
import { useAsyncEffect } from '../../hooks/useAsyncEffect'
import { useAsyncValue } from '../../hooks/useAsyncValue.ts'
import { useWatch } from '../../hooks/useWatch'
import { useSelector } from '../../types/reactRedux'
import { asNotifInfo } from '../../types/types'
import { getOtpReminderModal } from '../../util/otpReminder'

const PRIORITY_NOTIFICATION_KEYS = ['ip2FaReminder', 'lightAccountReminder', 'otpReminder', 'pwReminder']

/**
 * Updates notification info with dateReceived only when transitioning from complete to incomplete
 */
export const updateNotificationInfo = async (
  account: EdgeAccount,
  notifStateKey: string,
  /** The condition the notification is based on */
  isConditionActive: boolean,
  params?: { walletId: string }
): Promise<void> => {
  const { notifState } = getLocalAccountSettings()
  let currentNotifInfo = notifState[notifStateKey]

  if (currentNotifInfo == null) {
    // If it's a new notification, never seen, initialize it:
    currentNotifInfo = asNotifInfo({})
    currentNotifInfo.isBannerHidden = !isConditionActive
    currentNotifInfo.isCompleted = !isConditionActive
  } else {
    // Otherwise, update existing notification:

    // We only manage completion status here, so don't bother writing any updates if `isComplete` won't get changed:
    if (isConditionActive === !currentNotifInfo.isCompleted) return

    // Change from inactive to active:
    if (isConditionActive) {
      currentNotifInfo.isCompleted = false
      currentNotifInfo.isBannerHidden = false
    }

    // Change from active to inactive:
    if (!isConditionActive) {
      currentNotifInfo.isCompleted = true
      currentNotifInfo.isBannerHidden = true
    }
  }

  await writeAccountNotifInfo(account, notifStateKey, { ...currentNotifInfo, isPriority: PRIORITY_NOTIFICATION_KEYS.includes(notifStateKey), params })
}

/**
 * Checks for new notifications that have not yet been saved to `deviceNotifications`
 */
export const NotificationServices = () => {
  const { accountNotifDismissInfo, notifState } = getLocalAccountSettings()

  const account = useSelector(state => state.core.account)
  const isLightAccountReminder = account.id != null && account.username == null
  const detectedTokensRedux = useSelector(state => state.core.enabledDetectedTokens)
  const isPwReminder = useSelector(state => state.ui.passwordReminder.needsPasswordCheck)

  const wallets = useWatch(account, 'currencyWallets')
  const otpKey = useWatch(account, 'otpKey')

  const [isOtpReminderModal] = useAsyncValue(async () => {
    try {
      const otpReminderModal = await getOtpReminderModal(account)
      return otpReminderModal != null
    } catch (error) {
      return false
    }
  }, [account])

  // Update notification info with
  // 1. Date last received if transitioning from incomplete to complete
  // 2. Reset `isBannerHidden` if it's a new notification
  useAsyncEffect(
    async () => {
      // New token(s) detected
      Object.keys(wallets).forEach(async walletId => {
        const newTokenKey = `newToken-${walletId}`
        const newTokenIds = detectedTokensRedux[walletId]

        if (newTokenIds != null && newTokenIds.length > 0 && notifState[newTokenKey] == null) {
          // Only happens once per notification info key, shouldn't need to
          // write the completion state when detected tokens change
          await updateNotificationInfo(account, newTokenKey, true, { walletId })
        }
      })

      await updateNotificationInfo(
        account,
        'ip2FaReminder',
        !isLightAccountReminder && otpKey == null && accountNotifDismissInfo != null && !accountNotifDismissInfo.ip2FaNotifShown
      )
      await updateNotificationInfo(account, 'lightAccountReminder', isLightAccountReminder)
      await updateNotificationInfo(account, 'otpReminder', isOtpReminderModal ?? false)

      await updateNotificationInfo(account, 'pwReminder', isPwReminder)

      // cleanup:
      return () => {}
    },
    [account, isOtpReminderModal, isLightAccountReminder, isPwReminder, accountNotifDismissInfo, detectedTokensRedux, notifState, wallets],
    'NotificationServices'
  )

  return null
}
