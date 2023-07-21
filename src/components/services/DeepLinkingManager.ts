/* global requestAnimationFrame */

import messaging, { FirebaseMessagingTypes } from '@react-native-firebase/messaging'
import * as React from 'react'
import { Linking } from 'react-native'

import { launchDeepLink, retryPendingDeepLink } from '../../actions/DeepLinkingActions'
import { pushMessagePayloadToEdgeUri } from '../../controllers/action-queue/types/pushPayloadTypes'
import { ENV } from '../../env'
import { useAsyncEffect } from '../../hooks/useAsyncEffect'
import { useDispatch, useSelector } from '../../types/reactRedux'
import { NavigationBase } from '../../types/routerTypes'
import { parseDeepLink } from '../../util/DeepLinkParser'
import { showError } from './AirshipInstance'

interface Props {
  navigation: NavigationBase
}

export function DeepLinkingManager(props: Props) {
  const dispatch = useDispatch()
  const pendingDeepLink = useSelector(state => state.pendingDeepLink)
  const { navigation } = props

  // We don't actually read these, but we need them to trigger updates:
  const accountReferralLoaded = useSelector(state => state.account.accountReferralLoaded)
  const wallets = useSelector(state => state.ui.wallets)

  // Retry links that need a different app state:
  React.useEffect(() => {
    if (pendingDeepLink == null) return

    // Wait a bit, since logging in can sometimes stomp us:
    requestAnimationFrame(() => {
      dispatch(retryPendingDeepLink(navigation))
    })
  }, [accountReferralLoaded, dispatch, navigation, pendingDeepLink, wallets])

  const handleUrl = async (url: string) => {
    try {
      await dispatch(launchDeepLink(navigation, parseDeepLink(url)))
    } catch (error: any) {
      showError(error)
    }
  }

  // Startup tasks:
  useAsyncEffect(async () => {
    const listener = Linking.addEventListener('url', async event => await handleUrl(event.url))

    let url = await Linking.getInitialURL()
    if (url == null && ENV.YOLO_DEEP_LINK != null) url = ENV.YOLO_DEEP_LINK
    if (url != null) await handleUrl(url)

    return () => listener.remove()
  }, [])

  const handlePushMessage = async (message: FirebaseMessagingTypes.RemoteMessage) => {
    try {
      const url = pushMessagePayloadToEdgeUri(message)
      if (url == null) {
        // Unhandled push message ie. security alerts
        return
      }
      await handleUrl(url)
    } catch (error) {
      showError(error)
    }
  }

  // Firebase messaging
  useAsyncEffect(async () => {
    /**
     * Fires when the app launches from push notification
     * */
    const remoteMessage = await messaging().getInitialNotification()
    if (remoteMessage != null) {
      await handlePushMessage(remoteMessage)
    }

    /**
     * Fires when the app is in background
     * */
    messaging().onNotificationOpenedApp(remoteMessage => {
      handlePushMessage(remoteMessage).catch(err => console.warn(err))
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
