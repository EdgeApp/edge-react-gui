import { useNavigation } from '@react-navigation/native'
import * as React from 'react'
import { sprintf } from 'sprintf-js'

import { logoutRequest } from '../../actions/LoginActions'
import { useIsAppForeground } from '../../hooks/useIsAppForeground'
import { lstrings } from '../../locales/strings'
import { useDispatch, useSelector } from '../../types/reactRedux'
import { NavigationBase } from '../../types/routerTypes'
import { showError } from './AirshipInstance'

export const AutoLogout = () => {
  const dispatch = useDispatch()
  const navigation = useNavigation<NavigationBase>()
  const stateRef = React.useRef({ timestamp: new Date(), isAppForeground: true })
  const settingsLoaded = useSelector(state => state.ui.settings.settingsLoaded ?? false)
  const autoLogoutTimeInSeconds = useSelector(state => state.ui.settings.autoLogoutTimeInSeconds || Infinity)
  const isAppForeground = useIsAppForeground()

  React.useEffect(() => {
    // Check if app came back from background
    const appForegrounded = !stateRef.current.isAppForeground && isAppForeground
    // Check if time for logout has expired
    const timestamp = new Date()
    // @ts-expect-error
    const differenceInSeconds = (timestamp - stateRef.current.timestamp) / 1000
    const timeExpired = differenceInSeconds > autoLogoutTimeInSeconds
    // Logout If all the conditions for autoLogout are met
    if (appForegrounded && settingsLoaded && timeExpired)
      dispatch(logoutRequest(navigation)).catch(err => {
        console.warn(err)
        showError(sprintf(lstrings.auto_log_off_failed_message_s, String(err)))
      })
    // Update the new appState
    stateRef.current = { timestamp, isAppForeground }
  }, [autoLogoutTimeInSeconds, dispatch, isAppForeground, settingsLoaded, navigation])

  return null
}
