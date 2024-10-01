import messaging, { FirebaseMessagingTypes } from '@react-native-firebase/messaging'
import * as React from 'react'
import { Linking } from 'react-native'
import FontAwesomeIcon from 'react-native-vector-icons/FontAwesome'

import { launchDeepLink } from '../../actions/DeepLinkingActions'
import { ENV } from '../../env'
import { useAsyncEffect } from '../../hooks/useAsyncEffect'
import { useWatch } from '../../hooks/useWatch'
import { defaultAccount } from '../../reducers/CoreReducer'
import { DeepLink } from '../../types/DeepLinkTypes'
import { useDispatch, useSelector } from '../../types/reactRedux'
import { NavigationBase } from '../../types/routerTypes'
import { parseDeepLink } from '../../util/DeepLinkParser'
import { parsePushMessage } from '../../util/PushMessageParser'
import { FlashNotification } from '../navigation/FlashNotification'
import { Airship, showDevError, showError } from './AirshipInstance'
import { cacheStyles, Theme, useTheme } from './ThemeContext'

interface Props {
  navigation: NavigationBase
}

export function DeepLinkingManager(props: Props) {
  const { navigation } = props
  const dispatch = useDispatch()
  const theme = useTheme()
  const styles = getStyles(theme)

  const [pendingLink, setPendingLink] = React.useState<DeepLink | null>()

  const account = useSelector(state => state.core.account)
  const accountReferralLoaded = useSelector(state => state.account.accountReferralLoaded)
  const settingsLoaded = useSelector(state => state.ui.settings.settingsLoaded)

  // Wait for wallets to load:
  const activeWalletIds = useWatch(account, 'activeWalletIds')
  const currencyWallets = useWatch(account, 'currencyWallets')
  const currencyWalletErrors = useWatch(account, 'currencyWalletErrors')
  const allWalletsLoaded = activeWalletIds.every(walletId => currencyWallets[walletId] != null || currencyWalletErrors[walletId] != null)

  // We need to be fully logged in to handle most link types:
  const canHandleLink: boolean =
    (account !== defaultAccount && accountReferralLoaded && allWalletsLoaded && settingsLoaded) ||
    // We can always handle recovery links:
    pendingLink?.type === 'passwordRecovery'

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
      function handleBackgroundPushMessage(message: FirebaseMessagingTypes.RemoteMessage): void {
        try {
          const link = parsePushMessage(message)
          if (link != null) setPendingLink(link)
        } catch (error: unknown) {
          // The user does not initiate these, so use a dev error:
          showDevError(error)
        }
      }

      /** Handler for push messages received while app is in the foreground. */
      const handleForegroundPushMessage = (message: FirebaseMessagingTypes.RemoteMessage) => {
        const title = message.notification?.title ?? ''
        const body = message.notification?.body ?? ''

        if (title === '' && body === '') {
          console.error('FirebaseMessagingTypes.RemoteMessage (foreground push message) has no title and no body')
          return
        }

        let notifMessage: string
        if (title === '') {
          console.warn('FirebaseMessagingTypes.RemoteMessage (foreground push message) has no title')
          notifMessage = body
        } else if (body === '') {
          console.warn('FirebaseMessagingTypes.RemoteMessage (foreground push message) has no body')
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
            icon={<FontAwesomeIcon name="bell-o" size={theme.rem(2)} style={styles.icon} />}
          />
        )).catch(error => showDevError(String(error)))
      }

      // Subscribe to various incoming events:
      const linkingCleanup = Linking.addEventListener('url', event => {
        handleDeepLink(event.url)
      })
      const messageCleanup = messaging().onMessage(message => {
        handleForegroundPushMessage(message)
      })
      const launchCleanup = messaging().onNotificationOpenedApp(message => {
        handleBackgroundPushMessage(message)
      })

      // Load any tapped links:
      const url = (await Linking.getInitialURL()) ?? ENV.YOLO_DEEP_LINK
      if (url != null) handleDeepLink(url)

      // Load any links sent by push messages:
      const message = await messaging().getInitialNotification()
      if (message != null) handleBackgroundPushMessage(message)

      return () => {
        if (linkingCleanup != null) linkingCleanup.remove()
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
