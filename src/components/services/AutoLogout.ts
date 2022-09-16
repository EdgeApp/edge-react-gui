import { logoutRequest } from '../../actions/LoginActions'
import { useIsAppForeground } from '../../hooks/useIsAppForeground'
import { useEffect, useRef } from '../../types/reactHooks'
import { useDispatch, useSelector } from '../../types/reactRedux'

export const AutoLogout = () => {
  const dispatch = useDispatch()
  const stateRef = useRef({ timestamp: new Date(), isAppForeground: true })
  const loginStatus = useSelector(state => state.ui.settings.loginStatus ?? false)
  const autoLogoutTimeInSeconds = useSelector(state => state.ui.settings.autoLogoutTimeInSeconds || Infinity)
  const isAppForeground = useIsAppForeground()

  // @ts-expect-error
  useEffect(() => {
    // Check if app came back from background
    const appForegrounded = !stateRef.current.isAppForeground && isAppForeground
    // Check if time for logout has expired
    const timestamp = new Date()
    // @ts-expect-error
    const differenceInSeconds = (timestamp - stateRef.current.timestamp) / 1000
    const timeExpired = differenceInSeconds > autoLogoutTimeInSeconds
    // Logout If all the conditions for autoLogout are met
    if (appForegrounded && loginStatus && timeExpired) dispatch(logoutRequest())
    // Update the new appState
    stateRef.current = { timestamp, isAppForeground }
  }, [autoLogoutTimeInSeconds, dispatch, isAppForeground, loginStatus])

  return null
}
