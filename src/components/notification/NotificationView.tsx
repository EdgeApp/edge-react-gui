import type { EdgeAccount } from 'edge-core-js'
import * as React from 'react'
import type { LayoutChangeEvent } from 'react-native'
import Animated, {
  interpolate,
  type SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withTiming
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
import type { NavigationBase } from '../../types/routerTypes'
import { getThemedIconUri } from '../../util/CdnUris'
import { showOtpReminderModal } from '../../util/otpReminder'
import { openBrowserUri } from '../../util/WebUtils'
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
): Promise<void> => {
  await writeAccountNotifInfo(account, accountNotifStateKey, {
    isBannerHidden: true
  })
}

/**
 * Manages which notification cards are shown in a persistent app-wide view.
 */
export const NotificationView: React.FC<Props> = props => {
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

  // Local debounced and ordered display state for notification cards
  const [displayOrderIds, setDisplayOrderIds] = React.useState<string[]>([])
  const [cardHeights, setCardHeights] = React.useState<Record<string, number>>(
    {}
  )
  const debounceTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(
    null
  )

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

  // Build current visible id set based on source of truth state
  const computeVisibleIds = React.useCallback((): string[] => {
    const visibleIds: string[] = []

    const {
      lightAccountReminder = { isBannerHidden: true },
      otpReminder = { isBannerHidden: true },
      pwReminder = { isBannerHidden: true },
      ip2FaReminder = { isBannerHidden: true }
    } = notifState

    if (!lightAccountReminder.isBannerHidden) visibleIds.push('backup')

    // New token cards per wallet
    Object.keys(wallets).forEach(walletId => {
      const newTokenKey = `newToken-${walletId}`
      const newTokenIds = detectedTokensRedux[walletId]
      const isShowNewTokenNotif =
        notifState[newTokenKey] != null &&
        !notifState[newTokenKey].isBannerHidden
      if (
        isShowNewTokenNotif &&
        newTokenIds != null &&
        newTokenIds.length > 0
      ) {
        visibleIds.push(newTokenKey)
      }
    })

    if (!otpReminder.isBannerHidden && !account.isDuressAccount)
      visibleIds.push('otp')

    if (!pwReminder.isBannerHidden && !account.isDuressAccount)
      visibleIds.push('pw')

    if (
      pwReminder.isBannerHidden &&
      !ip2FaReminder.isBannerHidden &&
      !account.isDuressAccount
    )
      visibleIds.push('ip2fa')

    return visibleIds
  }, [account.isDuressAccount, detectedTokensRedux, notifState, wallets])

  // Debounce and reconcile local display order with current visibility
  React.useEffect(() => {
    const nextVisibleIds = computeVisibleIds()

    if (debounceTimerRef.current != null) clearTimeout(debounceTimerRef.current)
    debounceTimerRef.current = setTimeout(() => {
      setDisplayOrderIds(prev => {
        // Remove ids no longer visible
        const kept = prev.filter(id => nextVisibleIds.includes(id))
        // Prepend newly visible ids so they appear at the top of the stack
        const newlyVisible: string[] = []
        nextVisibleIds.forEach(id => {
          if (!prev.includes(id)) newlyVisible.push(id)
        })
        return [...newlyVisible, ...kept]
      })
    }, 250)

    // Cleanup
    return () => {
      if (debounceTimerRef.current != null) {
        clearTimeout(debounceTimerRef.current)
        debounceTimerRef.current = null
      }
    }
  }, [computeVisibleIds])

  // Build a card element for a given id using current state
  const buildCardElement = React.useCallback(
    (id: string): React.ReactElement | null => {
      if (id === 'backup') {
        return (
          <NotificationCard
            key={id}
            type="warning"
            title={lstrings.backup_notification_title}
            message={sprintf(lstrings.backup_notification_body, config.appName)}
            onPress={handleBackupPress}
            testID="notifBackup"
          />
        )
      }

      if (id === 'otp') {
        return (
          <NotificationCard
            key={id}
            type="warning"
            title={lstrings.otp_reset_modal_header}
            message={lstrings.notif_otp_message}
            onPress={handleOtpReminderPress}
            onDismiss={handleOtpReminderClose}
            testID="notifOtp"
          />
        )
      }

      if (id === 'pw') {
        return (
          <NotificationCard
            key={id}
            type="info"
            title={lstrings.password_reminder_card_title}
            message={lstrings.password_reminder_card_body}
            onPress={handlePasswordReminderPress}
            onDismiss={handlePasswordReminderClose}
            testID="notifPassword"
          />
        )
      }

      if (id === 'ip2fa') {
        return (
          <NotificationCard
            key={id}
            type="info"
            title={lstrings.notif_ip_validation_enabled_title}
            message={sprintf(
              lstrings.notif_ip_validation_enabled_body_1s,
              config.appName
            )}
            iconUri={getThemedIconUri(theme, 'notifications/icon-lock')}
            onPress={handle2FaEnabledPress}
            onDismiss={handle2FaEnabledClose}
          />
        )
      }

      if (id.startsWith('newToken-')) {
        const walletId = id.slice('newToken-'.length)
        const newTokenIds = detectedTokensRedux[walletId]
        const wallet = wallets[walletId]
        if (wallet == null || newTokenIds == null || newTokenIds.length === 0)
          return null

        const handleCloseNewToken = async (): Promise<void> => {
          dispatch({
            type: 'CORE/DISMISS_NEW_TOKENS',
            data: { walletId }
          })
        }
        const handlePressNewToken = async (): Promise<void> => {
          await handleCloseNewToken()
          navigationDebounced.navigate('manageTokens', {
            walletId,
            newTokenIds
          })
        }

        const { name, currencyInfo } = wallet
        const message =
          name == null || name.trim() === ''
            ? sprintf(
                lstrings.notif_tokens_detected_on_address_1s,
                currencyInfo.currencyCode
              )
            : sprintf(lstrings.notif_tokens_detected_on_wallet_name_1s, name)

        return (
          <NotificationCard
            key={id}
            type="info"
            title={lstrings.notif_tokens_detected_title}
            message={message}
            onPress={handlePressNewToken}
            onDismiss={handleCloseNewToken}
          />
        )
      }

      return null
    },
    [
      dispatch,
      detectedTokensRedux,
      handle2FaEnabledClose,
      handle2FaEnabledPress,
      handleBackupPress,
      handleOtpReminderClose,
      handleOtpReminderPress,
      handlePasswordReminderClose,
      handlePasswordReminderPress,
      navigationDebounced,
      theme,
      wallets
    ]
  )

  // Compute absolute bottom-offsets and total stack height
  const bottomFirstIds = React.useMemo(
    () => [...displayOrderIds].reverse(),
    [displayOrderIds]
  )

  const offsetsById = React.useMemo(() => {
    const map: Record<string, number> = {}
    let accum = 0
    for (const id of bottomFirstIds) {
      map[id] = accum
      const h = cardHeights[id] ?? theme.rem(5)
      accum += h
    }
    return map
  }, [bottomFirstIds, cardHeights, theme])

  const totalHeight = React.useMemo(() => {
    return bottomFirstIds.reduce(
      (sum, id) => sum + (cardHeights[id] ?? theme.rem(5)),
      0
    )
  }, [bottomFirstIds, cardHeights, theme])

  const handleMeasureHeight = React.useCallback(
    (id: string, height: number) => {
      setCardHeights(prev => {
        const existing = prev[id]
        if (existing === height) return prev
        return { ...prev, [id]: height }
      })
    },
    []
  )

  return (
    <AnimatedViewCardStack
      hasTabs={hasTabs}
      insetBottom={insetBottom}
      footerHeight={footerHeight}
      footerOpenRatio={footerOpenRatio}
      stackHeight={totalHeight}
      onLayout={handleLayout}
    >
      {bottomFirstIds.map((id, index) => {
        const element = buildCardElement(id)
        if (element == null) return null
        const offset = offsetsById[id] ?? 0
        const zIndex = index + 1
        return (
          <FallingCardWrapper
            key={id}
            id={id}
            targetOffset={offset}
            zIndex={zIndex}
            onMeasuredHeight={handleMeasureHeight}
            padding={theme.rem(0.25)}
          >
            {element}
          </FallingCardWrapper>
        )
      })}
    </AnimatedViewCardStack>
  )
}

/** Smoothly position the card stack against whatever bottom elements we have */
const AnimatedViewCardStack = styled(Animated.View)<{
  hasTabs: boolean
  insetBottom: number
  footerHeight: number
  footerOpenRatio: SharedValue<number>
  stackHeight: number
}>(
  theme =>
    ({ hasTabs, insetBottom, footerHeight, footerOpenRatio, stackHeight }) => {
      return [
        {
          position: 'absolute',
          left: 0,
          right: 0,
          justifyContent: 'flex-end',
          bottom: theme.rem(0.25)
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
                translateY: -(
                  maybeMenuBarHeight +
                  offsetFooterHeight +
                  insetBottom
                )
              }
            ],
            height: stackHeight
          }
        })
      ]
    }
)

interface FallingCardWrapperProps {
  id: string
  children: React.ReactNode
  padding: number
  targetOffset: number
  zIndex: number
  onMeasuredHeight: (id: string, height: number) => void
}

/** Wraps a child `NotificationCard` to position absolutely, and simulate
 * a card falling into place with a gravity animation. */
const FallingCardWrapper: React.FC<FallingCardWrapperProps> = (
  props: FallingCardWrapperProps
) => {
  const { id, targetOffset, zIndex, onMeasuredHeight, children, padding } =
    props
  const offset = useSharedValue(targetOffset)
  const theme = useTheme()
  const appearOpacity = useSharedValue(0)
  const appearShift = useSharedValue(theme.rem(0.5))

  React.useEffect(() => {
    offset.value = withTiming(targetOffset, { duration: 250 })
  }, [offset, targetOffset])

  // One-time entry animation: start slightly higher, fade in, and drop to place
  React.useEffect(() => {
    appearOpacity.value = withTiming(1, { duration: 220 })
    appearShift.value = withTiming(0, { duration: 220 })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const animatedStyle = useAnimatedStyle(() => {
    return {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: offset.value + appearShift.value,
      opacity: appearOpacity.value,
      padding
    }
  })

  return (
    <Animated.View
      style={[animatedStyle, { zIndex }]}
      onLayout={event => {
        onMeasuredHeight(id, event.nativeEvent.layout.height)
      }}
    >
      {children}
    </Animated.View>
  )
}
