import { EdgeAccount } from 'edge-core-js'

import {
  getLocalAccountSettings,
  useAccountSettings,
  writeAccountNotifInfo
} from '../../actions/LocalSettingsActions'
import { useAsyncEffect } from '../../hooks/useAsyncEffect.ts'
import { useWatch } from '../../hooks/useWatch.ts'
import { useSelector } from '../../types/reactRedux.ts'
import { asNotifInfo } from '../../types/types.ts'
import { infoServerData } from '../../util/network.ts'
import {
  OTP_REMINDER_MILLISECONDS,
  useOtpSettings
} from '../../util/otpUtils.ts'
import { checkAndAddExpiredPromos } from '../../util/promoCardUtils.ts'

const PRIORITY_NOTIFICATION_KEYS = [
  'ip2FaReminder',
  'lightAccountReminder',
  'otpReminder',
  'pwReminder'
]

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
  params?: {
    walletId?: string
    promoCard?: {
      messageId: string
      title: string
      body: string
      ctaUrl: string
    }
  }
): Promise<void> => {
  const { notifState } = await getLocalAccountSettings(account)
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

    // If we have a promo card, we don't want to update the completion status based on condition
    // because promo cards don't have a "condition" in the traditional sense
    const isPromoCard = currentNotifInfo.params?.promoCard != null

    // For non-promo cards, we manage completion status
    if (!isPromoCard) {
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
  }

  // Merge any additional properties
  const updatedNotifInfo = {
    ...currentNotifInfo,
    isPriority: PRIORITY_NOTIFICATION_KEYS.includes(notifStateKey),
    params
  }

  await writeAccountNotifInfo(account, notifStateKey, updatedNotifInfo)
}

/**
 * Checks for new notifications that have not yet been saved to `notifState`
 */
export const NotificationService = (props: Props) => {
  const { account } = props

  const { notifState, accountNotifDismissInfo } = useAccountSettings()
  const otpSettings = useOtpSettings()

  const wallets = useWatch(account, 'currencyWallets')
  const otpKey = useWatch(account, 'otpKey')

  const detectedTokensRedux = useSelector(
    state => state.core.enabledDetectedTokens
  )
  const isPwReminder = useSelector(
    state => state.ui.passwordReminder.needsPasswordCheck
  )

  const isLightAccountReminder = account.id != null && account.username == null

  const isOtpReminder =
    otpKey == null &&
    !isLightAccountReminder &&
    !otpSettings.dontAsk &&
    ((otpSettings.lastChecked == null &&
      (account.created == null ||
        Date.now() > account.created.valueOf() + OTP_REMINDER_MILLISECONDS)) ||
      (otpSettings.lastChecked != null &&
        Date.now() >
          otpSettings.lastChecked.valueOf() + OTP_REMINDER_MILLISECONDS))

  const isIp2faReminder =
    !isLightAccountReminder &&
    otpKey == null &&
    accountNotifDismissInfo != null &&
    !accountNotifDismissInfo.ip2FaNotifShown

  // Update notification info with
  // 1. Date last received if transitioning from incomplete to complete
  // 2. Reset `isBannerHidden` if it's a new notification
  useAsyncEffect(
    async () => {
      // New token(s) detected
      Object.keys(wallets).forEach(async walletId => {
        const newTokenKey = `newToken-${walletId}`
        const newTokenIds = detectedTokensRedux[walletId]

        if (
          newTokenIds != null &&
          newTokenIds.length > 0 &&
          notifState[newTokenKey] == null
        ) {
          // Only happens once per notification info key, shouldn't need to
          // write the completion state when detected tokens change
          await updateNotificationInfo(account, newTokenKey, true, { walletId })
        }
      })

      await updateNotificationInfo(account, 'ip2FaReminder', isIp2faReminder)
      await updateNotificationInfo(
        account,
        'lightAccountReminder',
        isLightAccountReminder
      )
      await updateNotificationInfo(
        account,
        'otpReminder',
        isOtpReminder ?? false
      )
      await updateNotificationInfo(account, 'pwReminder', isPwReminder)

      // Check for expired promos from the info server and add them to notifications
      if (infoServerData.rollup?.promoCards2 != null) {
        await checkAndAddExpiredPromos(
          account,
          infoServerData.rollup.promoCards2
        )
      }

      // cleanup:
      return () => {}
    },
    [
      isIp2faReminder,
      isLightAccountReminder,
      isOtpReminder,
      isPwReminder,
      wallets,
      detectedTokensRedux,
      notifState
    ],
    'NotificationServices'
  )

  // Make sure the backup banner is always shown on login if needed. We do this
  // separately in this effect so that we can hide the banner during current
  // login session if they so choose.
  useAsyncEffect(
    async () => {
      if (!isLightAccountReminder) return

      await writeAccountNotifInfo(account, 'lightAccountReminder', {
        isBannerHidden: false,
        isCompleted: false
      })
    },
    [isLightAccountReminder],
    'NotificationServices'
  )

  return null
}
