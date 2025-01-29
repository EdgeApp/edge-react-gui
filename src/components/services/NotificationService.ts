import { EdgeAccount } from 'edge-core-js'

import { getLocalAccountSettings, useAccountSettings, writeAccountNotifInfo } from '../../actions/LocalSettingsActions'
import { useAsyncEffect } from '../../hooks/useAsyncEffect.ts'
import { useAsyncValue } from '../../hooks/useAsyncValue.ts'
import { useWatch } from '../../hooks/useWatch.ts'
import { useSelector } from '../../types/reactRedux.ts'
import { asNotifInfo } from '../../types/types.ts'
import { getOtpReminderModal } from '../../util/otpReminder.tsx'

const PRIORITY_NOTIFICATION_KEYS = ['ip2FaReminder', 'lightAccountReminder', 'otpReminder', 'pwReminder']

interface Props {
  account: EdgeAccount
}

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
  // Wait on notifState to initialize
  if (notifState == null) return

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
    else {
      currentNotifInfo.isCompleted = true
      currentNotifInfo.isBannerHidden = true
    }
  }

  await writeAccountNotifInfo(account, notifStateKey, { ...currentNotifInfo, isPriority: PRIORITY_NOTIFICATION_KEYS.includes(notifStateKey), params })
}

/**
 * Checks for new notifications that have not yet been saved to `notifState`
 */
export const NotificationService = (props: Props) => {
  const { account } = props
  const { notifState, accountNotifDismissInfo } = useAccountSettings()

  const isLightAccountReminder = account.id != null && account.username == null
  const detectedTokensRedux = useSelector(state => state.core.enabledDetectedTokens)
  const isPwReminder = useSelector(state => state.ui.passwordReminder.needsPasswordCheck)
  const wallets = useWatch(account, 'currencyWallets')
  const otpKey = useWatch(account, 'otpKey')
  const isIp2faReminder = !isLightAccountReminder && otpKey == null && accountNotifDismissInfo != null && !accountNotifDismissInfo.ip2FaNotifShown

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

      await updateNotificationInfo(account, 'ip2FaReminder', isIp2faReminder)
      await updateNotificationInfo(account, 'lightAccountReminder', isLightAccountReminder)
      await updateNotificationInfo(account, 'otpReminder', isOtpReminderModal ?? false)
      await updateNotificationInfo(account, 'pwReminder', isPwReminder)

      // cleanup:
      return () => {}
    },
    [isIp2faReminder, isLightAccountReminder, isOtpReminderModal, isPwReminder, wallets, detectedTokensRedux, notifState],
    'NotificationServices'
  )

  return null
}
