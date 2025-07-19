import { EdgeAccount } from 'edge-core-js'
import * as React from 'react'
import { LayoutChangeEvent } from 'react-native'
import Animated, {
  interpolate,
  SharedValue,
  useAnimatedStyle
} from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { sprintf } from 'sprintf-js'

import { showBackupModal } from '../../actions/BackupModalActions'
import {
  useAccountSettings,
  writeAccountNotifInfo,
  writeLocalAccountSettings
} from '../../actions/LocalSettingsActions'
import { useAsyncNavigation } from '../../hooks/useAsyncNavigation'
import { useHandler } from '../../hooks/useHandler'
import { useWatch } from '../../hooks/useWatch'
import { lstrings } from '../../locales/strings'
import { useSceneFooterState } from '../../state/SceneFooterState'
import { config } from '../../theme/appConfig'
import { useDispatch, useSelector } from '../../types/reactRedux'
import { NavigationBase } from '../../types/routerTypes'
import { getThemedIconUri } from '../../util/CdnUris'
import { showOtpReminderModal } from '../../util/otpReminder'
import { openBrowserUri } from '../../util/WebUtils'
import { EdgeAnim, fadeIn, fadeOut } from '../common/EdgeAnim'
import { styled } from '../hoc/styled'
import { PasswordReminderModal } from '../modals/PasswordReminderModal'
import { Airship } from '../services/AirshipInstance'
import { updateNotificationInfo } from '../services/NotificationService'
import { useTheme } from '../services/ThemeContext'
import { MAX_TAB_BAR_HEIGHT, MIN_TAB_BAR_HEIGHT } from '../themed/MenuTabs'
import { NotificationCard } from './NotificationCard'

interface Props {
  navigation: NavigationBase
  hasTabs: boolean
  footerHeight: number
}

const hideBanner = async (
  account: EdgeAccount,
  accountNotifStateKey: string
) => {
  await writeAccountNotifInfo(account, accountNotifStateKey, {
    isBannerHidden: true
  })
}

const NotificationViewComponent = (props: Props) => {
  const { navigation, hasTabs, footerHeight } = props
  const accountSettings = useAccountSettings()
  const { notifState, accountNotifDismissInfo } = useAccountSettings()
  const navigationDebounced = useAsyncNavigation(navigation)
  const theme = useTheme()
  const dispatch = useDispatch()

  const account = useSelector(state => state.core.account)
  const detectedTokensRedux = useSelector(
    state => state.core.enabledDetectedTokens
  )
  const wallets = useWatch(account, 'currencyWallets')

  const { bottom: insetBottom } = useSafeAreaInsets()
  const footerOpenRatio = useSceneFooterState(state => state.footerOpenRatio)

  const [autoDetectTokenCards, setAutoDetectTokenCards] = React.useState<
    React.ReactElement[]
  >([])

  const handleBackupClose = useHandler(async () => {
    await hideBanner(account, 'lightAccountReminder')
  })
  const handleBackupPress = useHandler(async () => {
    await handleBackupClose()
    await showBackupModal({ navigation: navigationDebounced })
  })

  // For this specific notification, we overload the close button to also
  // directly modify state.ui.passwordReminder.needsPasswordCheck.
  // This is fine, because we have extensive logic to re-trigger the password
  // reminder when needed, anyway.
  const handlePasswordReminderClose = useHandler(async () => {
    await updateNotificationInfo(account, 'pwReminder', false)
    dispatch({
      type: 'PASSWORD_REMINDER/PASSWORD_REMINDER_POSTPONED'
    })
  })

  const handlePasswordReminderPress = useHandler(async () => {
    await handlePasswordReminderClose()
    await Airship.show(bridge => (
      <PasswordReminderModal bridge={bridge} navigation={navigationDebounced} />
    ))
  })

  const handle2FaEnabledClose = useHandler(async () => {
    // Update both notifState and accountNotifDismissInfo in a single write
    await writeLocalAccountSettings(account, {
      ...accountSettings,
      accountNotifDismissInfo: {
        ...accountNotifDismissInfo,
        ip2FaNotifShown: true
      },
      notifState: {
        ...accountSettings.notifState,
        ip2FaReminder: {
          ...(accountSettings.notifState.ip2FaReminder ?? {}),
          isBannerHidden: true
        }
      }
    })
  })
  const handle2FaEnabledPress = useHandler(async () => {
    await handle2FaEnabledClose()
    await openBrowserUri(config.ip2faSite)
  })

  const handleOtpReminderClose = useHandler(async () => {
    await hideBanner(account, 'otpReminder')
  })
  const handleOtpReminderPress = useHandler(async () => {
    await handleOtpReminderClose()
    await showOtpReminderModal(account)
  })

  const handleLayout = useHandler((event: LayoutChangeEvent) => {
    const { height } = event.nativeEvent.layout
    dispatch({ type: 'UI/SET_NOTIFICATION_HEIGHT', data: { height } })
  })

  // Show a tokens detected notification per walletId found in newTokens
  React.useEffect(() => {
    const newNotifs: React.ReactElement[] = []
    Object.keys(wallets).forEach(walletId => {
      const newTokenKey = `newToken-${walletId}`
      const newTokenIds = detectedTokensRedux[walletId]

      const handleCloseNewToken = async () => {
        // Since this isn't a priority notification, we can just fully complete
        // it here
        dispatch({
          type: 'CORE/DISMISS_NEW_TOKENS',
          data: { walletId }
        })
      }
      const handlePressNewToken = async () => {
        await handleCloseNewToken()
        navigationDebounced.navigate('manageTokens', {
          walletId,
          newTokenIds
        })
      }

      const isShowNewTokenNotif =
        notifState[newTokenKey] != null &&
        !notifState[newTokenKey].isBannerHidden
      if (
        isShowNewTokenNotif &&
        newTokenIds != null &&
        newTokenIds.length > 0
      ) {
        const { name, currencyInfo } = wallets[walletId]

        newNotifs.push(
          <NotificationCard
            key={walletId}
            type="info"
            title={lstrings.notif_tokens_detected_title}
            message={
              name == null || name.trim() === ''
                ? sprintf(
                    lstrings.notif_tokens_detected_on_address_1s,
                    currencyInfo.currencyCode
                  )
                : sprintf(
                    lstrings.notif_tokens_detected_on_wallet_name_1s,
                    name
                  )
            }
            onPress={handlePressNewToken}
            onClose={handleCloseNewToken}
          />
        )
      }

      setAutoDetectTokenCards(newNotifs)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [detectedTokensRedux, notifState, handleBackupPress, theme])

  const {
    lightAccountReminder = { isBannerHidden: true },
    otpReminder = { isBannerHidden: true },
    pwReminder = { isBannerHidden: true },
    ip2FaReminder = { isBannerHidden: true }
  } = notifState

  return (
    <NotificationCardsContainer
      hasTabs={hasTabs}
      insetBottom={insetBottom}
      footerHeight={footerHeight}
      footerOpenRatio={footerOpenRatio}
      onLayout={handleLayout}
    >
      <EdgeAnim
        visible={!lightAccountReminder.isBannerHidden}
        enter={fadeIn}
        exit={fadeOut}
      >
        <NotificationCard
          type="warning"
          title={lstrings.backup_notification_title}
          message={sprintf(lstrings.backup_notification_body, config.appName)}
          persistent
          onPress={handleBackupPress}
          testID="notifBackup"
        />
      </EdgeAnim>
      <EdgeAnim
        visible={autoDetectTokenCards.length > 0}
        enter={fadeIn}
        exit={fadeOut}
      >
        {autoDetectTokenCards}
      </EdgeAnim>
      <EdgeAnim
        visible={!otpReminder.isBannerHidden && !account.isDuressAccount}
        enter={fadeIn}
        exit={fadeOut}
      >
        <NotificationCard
          type="warning"
          title={lstrings.otp_reset_modal_header}
          message={lstrings.notif_otp_message}
          onPress={handleOtpReminderPress}
          onClose={handleOtpReminderClose}
          testID="notifOtp"
        />
      </EdgeAnim>
      <EdgeAnim
        visible={!pwReminder.isBannerHidden && !account.isDuressAccount}
        enter={fadeIn}
        exit={fadeOut}
      >
        <NotificationCard
          type="info"
          title={lstrings.password_reminder_card_title}
          message={lstrings.password_reminder_card_body}
          onPress={handlePasswordReminderPress}
          onClose={handlePasswordReminderClose}
          testID="notifPassword"
        />
      </EdgeAnim>
      <EdgeAnim
        visible={
          pwReminder.isBannerHidden &&
          !ip2FaReminder.isBannerHidden &&
          !account.isDuressAccount
        }
        enter={fadeIn}
        exit={fadeOut}
      >
        <NotificationCard
          type="info"
          title={lstrings.notif_ip_validation_enabled_title}
          message={sprintf(
            lstrings.notif_ip_validation_enabled_body_1s,
            config.appName
          )}
          iconUri={getThemedIconUri(theme, 'notifications/icon-lock')}
          onPress={handle2FaEnabledPress}
          onClose={handle2FaEnabledClose}
        />
      </EdgeAnim>
    </NotificationCardsContainer>
  )
}

const NotificationCardsContainer = styled(Animated.View)<{
  hasTabs: boolean
  insetBottom: number
  footerHeight: number
  footerOpenRatio: SharedValue<number>
}>(theme => ({ hasTabs, insetBottom, footerHeight, footerOpenRatio }) => {
  return [
    {
      position: 'absolute',
      paddingHorizontal: theme.rem(0.5),
      alignSelf: 'center',
      justifyContent: 'flex-end',
      bottom: theme.rem(0.5)
    },
    useAnimatedStyle(() => {
      const maybeMenuBarHeight = hasTabs
        ? interpolate(
            footerOpenRatio.value,
            [0, 1],
            [MIN_TAB_BAR_HEIGHT, MAX_TAB_BAR_HEIGHT]
          )
        : 0
      const offsetFooterHeight = footerOpenRatio.value * footerHeight
      return {
        transform: [
          {
            translateY: -(maybeMenuBarHeight + offsetFooterHeight + insetBottom)
          }
        ]
      }
    })
  ]
})

/**
 * Manages which notification cards are shown in a persistent app-wide view.
 * Currently implemented with one card, but may be extended to handle more in
 * the future.
 */
export const NotificationView = React.memo(NotificationViewComponent)
