// @flow
/* global requestAnimationFrame */

import { Linking } from 'react-native'

import ENV from '../../../env.json'
import { launchDeepLink, retryPendingDeepLink } from '../../actions/DeepLinkingActions.js'
import { useEffect } from '../../types/reactHooks.js'
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

  // Retry links that need a different app state:
  useEffect(() => {
    if (pendingDeepLink == null) return

    // Wait a bit, since logging in can sometimes stomp us:
    requestAnimationFrame(() => dispatch(retryPendingDeepLink()))
  }, [accountReferralLoaded, dispatch, pendingDeepLink, wallets])

  // Startup tasks:
  useEffect(() => {
    const listener = Linking.addEventListener('url', event => {
      try {
        dispatch(launchDeepLink(parseDeepLink(event.url)))
      } catch (error) {
        showError(error)
      }
    })
    Linking.getInitialURL()
      .then(url => {
        if (url == null && ENV.YOLO_DEEP_LINK != null) url = ENV.YOLO_DEEP_LINK
        if (url != null) dispatch(launchDeepLink(parseDeepLink(url)))
      })
      .catch(showError)
    return () => listener.remove()
  }, [dispatch])

  return null
}
