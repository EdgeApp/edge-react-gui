// @flow

import { logoutRequest } from '../../actions/LoginActions.js'
import { useIsAppForeground } from '../../hooks/useIsAppForeground.js'
import { useEffect, useRef } from '../../types/reactHooks.js'
import { useDispatch, useSelector } from '../../types/reactRedux.js'

export const AutoLogout = () => {
  const dispatch = useDispatch()
  const stateRef = useRef({ timestamp: new Date(), isAppForeground: true })
  const loginStatus = useSelector(state => state.ui.settings.loginStatus ?? false)
  const autoLogoutTimeInSeconds = useSelector(state => state.ui.settings.autoLogoutTimeInSeconds || Infinity)
  const isAppForeground = useIsAppForeground()

  useEffect(() => {
    // Check if app came back from background
    const appForegrounded = !stateRef.current.isAppForeground && isAppForeground
    // Check if time for logout has expired
    const timestamp = new Date()
    const differenceInSeconds = (timestamp - stateRef.current.timestamp) / 1000
    const timeExpired = differenceInSeconds > autoLogoutTimeInSeconds
    // Logout If all the conditions for autoLogout are met
    if (appForegrounded && loginStatus && timeExpired) dispatch(logoutRequest())
    // Update the new appState
    stateRef.current = { timestamp, isAppForeground }
  }, [autoLogoutTimeInSeconds, dispatch, isAppForeground, loginStatus])

  return null
}
