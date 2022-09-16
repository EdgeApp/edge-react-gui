/* global requestAnimationFrame */

import { Linking } from 'react-native'

import ENV from '../../../env.json'
import { launchDeepLink, retryPendingDeepLink } from '../../actions/DeepLinkingActions'
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

  return null
}
