import messaging, {
  type FirebaseMessagingTypes
} from '@react-native-firebase/messaging'
import * as React from 'react'

import {
  type DeepLinkReadiness,
  deepLinkReadinessRank,
  getDeepLinkReadiness,
  launchDeepLink
} from '../../actions/DeepLinkingActions'
import { ENV } from '../../env'
import { useAsyncEffect } from '../../hooks/useAsyncEffect'
import { useWatch } from '../../hooks/useWatch'
import { defaultAccount } from '../../reducers/CoreReducer'
import type { DeepLink } from '../../types/DeepLinkTypes'
import { useDispatch, useSelector } from '../../types/reactRedux'
import type { NavigationBase } from '../../types/routerTypes'
import { parseDeepLink } from '../../util/DeepLinkParser'
import { addUrlListener, getInitialURL } from '../../util/linking'
import { parsePushMessage } from '../../util/PushMessageParser'
import { BellIcon } from '../icons/ThemedIcons'
import { FlashNotification } from '../navigation/FlashNotification'
import { Airship, showDevError, showError } from './AirshipInstance'
import { cacheStyles, type Theme, useTheme } from './ThemeContext'

interface Props {
  navigation: NavigationBase
}

export const DeepLinkingManager: React.FC<Props> = props => {
  const { navigation } = props
  const dispatch = useDispatch()
  const theme = useTheme()
  const styles = getStyles(theme)

  const [pendingLink, setPendingLink] = React.useState<DeepLink | null>()

  const account = useSelector(state => state.core.account)
  const accountReferralLoaded = useSelector(
    state => state.account.accountReferralLoaded
  )
  const settingsLoaded = useSelector(state => state.ui.settings.settingsLoaded)

  const activeWalletIds = useWatch(account, 'activeWalletIds')
  const currencyWallets = useWatch(account, 'currencyWallets')
  const currencyWalletErrors = useWatch(account, 'currencyWalletErrors')
  const allWalletsLoaded = activeWalletIds.every(
    walletId =>
      currencyWallets[walletId] != null ||
      currencyWalletErrors[walletId] != null
  )

  // How much of the app is ready right now:
  const loggedIn = account !== defaultAccount && settingsLoaded === true
  const appReadiness: DeepLinkReadiness =
    loggedIn && accountReferralLoaded && allWalletsLoaded
      ? 'wallets'
      : loggedIn && accountReferralLoaded
      ? 'referral'
      : loggedIn
      ? 'account'
      : 'loggedOut'

  // Each link type waits only for the state it actually uses. Wallets are the
  // slowest thing to load, so a link that merely navigates - such as the ramps
  // buy/sell entry - follows as soon as the account is logged in:
  const canHandleLink: boolean =
    pendingLink != null &&
    deepLinkReadinessRank[appReadiness] >=
      deepLinkReadinessRank[getDeepLinkReadiness(pendingLink)]

  // Launches links, no matter how we got them:
  useAsyncEffect(
    async () => {
      if (!canHandleLink || pendingLink == null) return
      setPendingLink(undefined)
      await dispatch(launchDeepLink(navigation, pendingLink))
    },
    [canHandleLink, dispatch, navigation, pendingLink],
    'DeepLinkingManager:handleLink'
  )

  // Subscribe to incoming links and load any app start-up links:
  useAsyncEffect(
    async () => {
      function handleDeepLink(url: string): void {
        try {
          const link = parseDeepLink(url)
          setPendingLink(link)
        } catch (error: unknown) {
          // The user tapped on the link, so show a real error:
          showError(error)
        }
      }

      /** Handler for push messages received while app is in the background. */
      function handleBackgroundPushMessage(
        message: FirebaseMessagingTypes.RemoteMessage
      ): void {
        try {
          const link = parsePushMessage(message)
          if (link != null) setPendingLink(link)
        } catch (error: unknown) {
          // The user does not initiate these, so use a dev error:
          showDevError(error)
        }
      }

      /** Handler for push messages received while app is in the foreground. */
      const handleForegroundPushMessage = (
        message: FirebaseMessagingTypes.RemoteMessage
      ): void => {
        const title = message.notification?.title ?? ''
        const body = message.notification?.body ?? ''

        if (title === '' && body === '') {
          console.error(
            'FirebaseMessagingTypes.RemoteMessage (foreground push message) has no title and no body'
          )
          return
        }

        let notifMessage: string
        if (title === '') {
          console.warn(
            'FirebaseMessagingTypes.RemoteMessage (foreground push message) has no title'
          )
          notifMessage = body
        } else if (body === '') {
          console.warn(
            'FirebaseMessagingTypes.RemoteMessage (foreground push message) has no body'
          )
          notifMessage = title
        } else {
          notifMessage = `${title}\n\n${body}`
        }

        // Show a FlashNotification:
        Airship.show(bridge => (
          <FlashNotification
            bridge={bridge}
            message={notifMessage}
            onPress={() => {
              bridge.resolve()
            }}
            icon={<BellIcon size={theme.rem(2)} style={styles.icon} />}
          />
        )).catch((error: unknown) => {
          showDevError(String(error))
        })
      }

      // Subscribe to various incoming events:
      const removeUrlListener = addUrlListener(handleDeepLink)
      const messageCleanup = messaging().onMessage(message => {
        handleForegroundPushMessage(message)
      })
      const launchCleanup = messaging().onNotificationOpenedApp(message => {
        handleBackgroundPushMessage(message)
      })

      // Load any tapped links:
      const url = (await getInitialURL()) ?? ENV.YOLO_DEEP_LINK
      if (url != null) handleDeepLink(url)

      // Load any links sent by push messages:
      const message = await messaging().getInitialNotification()
      if (message != null) handleBackgroundPushMessage(message)

      return () => {
        removeUrlListener()
        if (messageCleanup != null) messageCleanup()
        if (launchCleanup != null) launchCleanup()
      }
    },
    [],
    'DeepLinkingManager:launch'
  )

  return null
}

const getStyles = cacheStyles((theme: Theme) => ({
  icon: {
    alignSelf: 'center',
    color: theme.iconTappable,
    margin: theme.rem(0.5)
  }
}))
