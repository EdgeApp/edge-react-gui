import * as React from 'react'
import { LayoutChangeEvent } from 'react-native'
import Animated, { interpolate, SharedValue, useAnimatedStyle } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { sprintf } from 'sprintf-js'

import { showBackupModal } from '../../actions/BackupModalActions'
import { getDeviceSettings, writeDeviceNotifDismissInfo } from '../../actions/DeviceSettingsActions'
import { getLocalAccountSettings, writeNotifDismissInfo } from '../../actions/LocalSettingsActions'
import { useAsyncEffect } from '../../hooks/useAsyncEffect'
import { useHandler } from '../../hooks/useHandler'
import { useWatch } from '../../hooks/useWatch'
import { lstrings } from '../../locales/strings'
import { useSceneFooterState } from '../../state/SceneFooterState'
import { useDispatch, useSelector } from '../../types/reactRedux'
import { NavigationBase } from '../../types/routerTypes'
import { getThemedIconUri } from '../../util/CdnUris'
import { getOtpReminderModal } from '../../util/otpReminder'
import { openBrowserUri } from '../../util/WebUtils'
import { EdgeAnim, fadeIn, fadeOut } from '../common/EdgeAnim'
import { styled } from '../hoc/styled'
import { PasswordReminderModal } from '../modals/PasswordReminderModal'
import { Airship } from '../services/AirshipInstance'
import { useTheme } from '../services/ThemeContext'
import { MAX_TAB_BAR_HEIGHT, MIN_TAB_BAR_HEIGHT } from '../themed/MenuTabs'
import { NotificationCard } from './NotificationCard'

interface Props {
  navigation: NavigationBase

  hasTabs: boolean
  footerHeight: number
}

const NotificationViewComponent = (props: Props) => {
  const { navigation, hasTabs, footerHeight } = props
  const theme = useTheme()
  const dispatch = useDispatch()

  const account = useSelector(state => state.core.account)
  const detectedTokensRedux = useSelector(state => state.core.enabledDetectedTokens)
  const needsPasswordCheck = useSelector(state => state.ui.passwordReminder.needsPasswordCheck)
  const fioAddresses = useSelector(state => state.ui.fioAddress.fioAddresses)

  const wallets = useWatch(account, 'currencyWallets')
  const otpKey = useWatch(account, 'otpKey')

  const { bottom: insetBottom } = useSafeAreaInsets()
  const footerOpenRatio = useSceneFooterState(state => state.footerOpenRatio)

  const [autoDetectTokenCards, setAutoDetectTokenCards] = React.useState<React.JSX.Element[]>([])
  const [otpReminderCard, setOtpReminderCard] = React.useState<React.JSX.Element>()
  const deviceNotifDismissInfo = getDeviceSettings().deviceNotifDismissInfo
  const accountNotifDismissInfo = getLocalAccountSettings().accountNotifDismissInfo

  const isBackupWarningNotifShown =
    account.id != null && account.username == null && fioAddresses.length > 0 && deviceNotifDismissInfo != null && !deviceNotifDismissInfo.backupNotifShown

  const handleBackupPress = useHandler(async () => {
    await writeDeviceNotifDismissInfo({ ...deviceNotifDismissInfo, backupNotifShown: true })
    await showBackupModal({ navigation })
  })

  const handlePasswordReminderPress = useHandler(async () => {
    await Airship.show(bridge => <PasswordReminderModal bridge={bridge} navigation={navigation} />)
  })

  const handle2FaEnabledDismiss = useHandler(async () => {
    await writeNotifDismissInfo(account, { ...accountNotifDismissInfo, ip2FaNotifShown: true })
  })
  const handle2FaEnabledPress = useHandler(async () => {
    await openBrowserUri('https://support.edge.app/hc/en-us/articles/7018106439579-Edge-Security-IP-Validation-and-2FA')
    await handle2FaEnabledDismiss()
  })

  const handleLayout = useHandler((event: LayoutChangeEvent) => {
    const { height } = event.nativeEvent.layout
    dispatch({ type: 'UI/SET_NOTIFICATION_HEIGHT', data: { height } })
  })

  // Show a tokens detected notification per walletId found in newTokens
  React.useEffect(() => {
    const newNotifs: React.JSX.Element[] = []
    Object.keys(wallets).forEach(walletId => {
      const newTokenIds = detectedTokensRedux[walletId]

      const dismissNewTokens = (walletId: string) => {
        dispatch({
          type: 'CORE/DISMISS_NEW_TOKENS',
          data: { walletId }
        })
      }

      if (newTokenIds != null && newTokenIds.length > 0) {
        const { name, currencyInfo } = wallets[walletId]

        newNotifs.push(
          <NotificationCard
            key={walletId}
            type="info"
            title={lstrings.notif_tokens_detected_title}
            message={
              name == null || name.trim() === ''
                ? sprintf(lstrings.notif_tokens_detected_on_address_1s, currencyInfo.currencyCode)
                : sprintf(lstrings.notif_tokens_detected_on_wallet_name_1s, name)
            }
            onPress={() => {
              dismissNewTokens(walletId)
              navigation.navigate('manageTokens', {
                walletId,
                newTokenIds
              })
            }}
            onClose={() => dismissNewTokens(walletId)}
          />
        )
      }

      setAutoDetectTokenCards(newNotifs)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [detectedTokensRedux, handleBackupPress, theme])

  // Check for 2FA/OTP reminder disabled notifications
  // Periodically remind the user to enable 2FA/OTP
  useAsyncEffect(
    async () => {
      const otpReminderModal = await getOtpReminderModal(account)

      if (otpReminderModal != null) {
        setOtpReminderCard(
          <NotificationCard type="warning" title={lstrings.otp_reset_modal_header} message={lstrings.notif_otp_message} onPress={otpReminderModal} />
        )
      }
    },
    [account],
    'otpNotificationCard'
  )

  return (
    <NotificationCardsContainer
      hasTabs={hasTabs}
      insetBottom={insetBottom}
      footerHeight={footerHeight}
      footerOpenRatio={footerOpenRatio}
      onLayout={handleLayout}
    >
      <EdgeAnim visible={isBackupWarningNotifShown} enter={fadeIn} exit={fadeOut}>
        <NotificationCard type="warning" title={lstrings.backup_title} message={lstrings.backup_web3_handle_warning_message} onPress={handleBackupPress} />
      </EdgeAnim>
      <EdgeAnim visible={autoDetectTokenCards.length > 0} enter={fadeIn} exit={fadeOut}>
        {autoDetectTokenCards}
      </EdgeAnim>
      <EdgeAnim visible={otpReminderCard != null} enter={fadeIn} exit={fadeOut}>
        {otpReminderCard}
      </EdgeAnim>
      <EdgeAnim visible={needsPasswordCheck} enter={fadeIn} exit={fadeOut}>
        <NotificationCard
          type="info"
          title={lstrings.password_reminder_card_title}
          message={lstrings.password_reminder_card_body}
          onPress={handlePasswordReminderPress}
        />
      </EdgeAnim>
      <EdgeAnim visible={otpKey != null && accountNotifDismissInfo != null && !accountNotifDismissInfo.ip2FaNotifShown} enter={fadeIn} exit={fadeOut}>
        <NotificationCard
          type="info"
          title={lstrings.notif_ip_validation_enabled_title}
          message={lstrings.notif_ip_validation_enabled_body}
          iconUri={getThemedIconUri(theme, 'notifications/icon-lock')}
          onPress={handle2FaEnabledPress}
          onClose={handle2FaEnabledDismiss}
        />
      </EdgeAnim>
    </NotificationCardsContainer>
  )
}

const NotificationCardsContainer = styled(Animated.View)<{ hasTabs: boolean; insetBottom: number; footerHeight: number; footerOpenRatio: SharedValue<number> }>(
  theme =>
    ({ hasTabs, insetBottom, footerHeight, footerOpenRatio }) => {
      return [
        {
          position: 'absolute',
          paddingHorizontal: theme.rem(0.5),
          alignSelf: 'center',
          justifyContent: 'flex-end',
          bottom: 0
        },
        useAnimatedStyle(() => {
          const maybeMenuBarHeight = hasTabs ? interpolate(footerOpenRatio.value, [0, 1], [MIN_TAB_BAR_HEIGHT, MAX_TAB_BAR_HEIGHT]) : 0
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
    }
)

/**
 * Manages which notification cards are shown in a persistent app-wide view.
 * Currently implemented with one card, but may be extended to handle more in
 * the future.
 */
export const NotificationView = React.memo(NotificationViewComponent)
