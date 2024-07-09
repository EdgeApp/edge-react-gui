import { useFocusEffect, useNavigation } from '@react-navigation/native'
import * as React from 'react'
import { BackHandler } from 'react-native'

import { logoutRequest } from '../actions/LoginActions'
import { AirshipToast } from '../components/common/AirshipToast'
import { Airship, showError } from '../components/services/AirshipInstance'
import { lstrings } from '../locales/strings'
import { defaultAccount } from '../reducers/CoreReducer'
import { useDispatch, useSelector } from '../types/reactRedux'
import { NavigationBase } from '../types/routerTypes'

/**
 * Shows a logout toast when the back button is pressed.
 *
 * This hook should be used on whichever scene lives
 * at the very bottom of the navigation stack,
 * such as the home scene or wallet list scene.
 *
 * This hook uses `useFocusEffect` internally, which means it will crash
 * if used in a modal or anywhere else except a top-level scene.
 */
export function useBackButtonToast() {
  const backPressedOnce = React.useRef(false)
  const account = useSelector(state => state.core.account)
  const dispatch = useDispatch()

  // Edge normally bans this hook, since it will crash when used in a modal,
  // but we already know that we are running in a real scene:
  const navigation: NavigationBase = useNavigation()

  useFocusEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      // Allow back if logged out or this is the second back press:
      if (account === defaultAccount || backPressedOnce.current) {
        dispatch(logoutRequest(navigation)).catch(err => showError(err))
        return
      }
      backPressedOnce.current = true

      // Show the toast for 3 seconds, and then clear the flag:
      Airship.show(bridge => <AirshipToast bridge={bridge} autoHideMs={3000} message={lstrings.back_button_tap_again_to_exit} />)
        .then(() => {
          backPressedOnce.current = false
        })
        .catch(err => showError(err))

      // Prevent the default behavior:
      return true
    })

    return () => subscription.remove()
  })
}
