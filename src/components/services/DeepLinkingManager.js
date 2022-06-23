// @flow
/* global requestAnimationFrame */

import { Linking } from 'react-native'

import ENV from '../../../env.json'
import { launchDeepLink, retryPendingDeepLink } from '../../actions/DeepLinkingActions.js'
import { useAsyncEffect } from '../../hooks/useAsyncEffect'
import { useEffect, useState } from '../../types/reactHooks'
import { useDispatch, useSelector } from '../../types/reactRedux.js'
import { parseDeepLink } from '../../util/DeepLinkParser.js'
import { showError } from './AirshipInstance.js'

type Props = {}

export function DeepLinkingManager(props: Props) {
  const dispatch = useDispatch()
  const pendingDeepLink = useSelector(state => state.pendingDeepLink)

  // We don't actually read these, but we need them to trigger updates:
  const accountReferralLoaded = useSelector(state => state.account.accountReferralLoaded)
  const wallets = useSelector(state => state.ui.wallets)
  const [url, setUrl] = useState<string | null>(null)

  // Retry links that need a different app state:
  useEffect(() => {
    if (pendingDeepLink == null) return

    // Wait a bit, since logging in can sometimes stomp us:
    requestAnimationFrame(() => dispatch(retryPendingDeepLink()))
  }, [accountReferralLoaded, dispatch, pendingDeepLink, wallets])

  useEffect(() => {
    try {
      if (url != null) dispatch(launchDeepLink(parseDeepLink(url)))
    } catch (error) {
      showError(error)
    }
  }, [dispatch, url])

  // Startup tasks:
  useAsyncEffect(async () => {
    const listener = Linking.addEventListener('url', event => {
      setUrl(event.url)
    })

    let url = await Linking.getInitialURL()
    if (url == null && ENV.YOLO_DEEP_LINK != null) url = ENV.YOLO_DEEP_LINK
    if (url != null) setUrl(url)

    return () => {
      listener.remove()
    }
  })

  return null
}
