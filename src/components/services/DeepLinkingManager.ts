/* global requestAnimationFrame */

import messaging, { FirebaseMessagingTypes } from '@react-native-firebase/messaging'
import { Linking } from 'react-native'

import ENV from '../../../env.json'
import { launchDeepLink, retryPendingDeepLink } from '../../actions/DeepLinkingActions'
import { pushMessagePayloadToEdgeUri } from '../../controllers/action-queue/types/pushPayloadTypes'
import { useAsyncEffect } from '../../hooks/useAsyncEffect'
import { useEffect } from '../../types/reactHooks'
import { useDispatch, useSelector } from '../../types/reactRedux'
import { parseDeepLink } from '../../util/DeepLinkParser'
import { showError } from './AirshipInstance'

type Props = {}

export function DeepLinkingManager(props: Props) {
  const dispatch = useDispatch()
  const pendingDeepLink = useSelector(state => state.pendingDeepLink)

  // We don't actually read these, but we need them to trigger updates:
  const accountReferralLoaded = useSelector(state => state.account.accountReferralLoaded)
  const wallets = useSelector(state => state.ui.wallets)

  // Retry links that need a different app state:
  // @ts-expect-error
  useEffect(() => {
    if (pendingDeepLink == null) return

    // Wait a bit, since logging in can sometimes stomp us:
    requestAnimationFrame(() => dispatch(retryPendingDeepLink()))
  }, [accountReferralLoaded, dispatch, pendingDeepLink, wallets])

  // @ts-expect-error
  const handleUrl = url => {
    try {
      dispatch(launchDeepLink(parseDeepLink(url)))
    } catch (error: any) {
      showError(error)
    }
  }

  // Startup tasks:
  useAsyncEffect(async () => {
    const listener = Linking.addEventListener('url', event => handleUrl(event.url))

    let url = await Linking.getInitialURL()
    if (url == null && ENV.YOLO_DEEP_LINK != null) url = ENV.YOLO_DEEP_LINK
    if (url != null) handleUrl(url)

    return () => listener.remove()
  }, [])

  const handlePushMessage = (message: FirebaseMessagingTypes.RemoteMessage) => {
    try {
      handleUrl(pushMessagePayloadToEdgeUri(message))
    } catch (error) {
      showError(error)
    }
  }

  // Firebase messaging
  useAsyncEffect(async () => {
    /**
     * Fires when the app launches from push notification
     * */
    messaging()
      .getInitialNotification()
      .then(remoteMessage => {
        if (remoteMessage != null) {
          handlePushMessage(remoteMessage)
        }
      })

    /**
     * Fires when the app is in background
     * */
    messaging().onNotificationOpenedApp(remoteMessage => {
      handlePushMessage(remoteMessage)
    })

    /**
     * Fires when the app is in foreground and receives a notification
     * */
    const unsubscribe = messaging().onMessage(remoteMessage => {
      // do nothing for now except return the unsubscribe function
    })

    return () => unsubscribe()
  }, [])

  return null
}
