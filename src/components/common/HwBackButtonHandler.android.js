/* eslint-disable flowtype/require-valid-file-annotation */

import { ToastAndroid } from 'react-native'
import { Actions } from 'react-native-router-flux'

import s from '../../locales/strings'

const ANDROID_TIME_INTERVAL_BACK_BUTTON = 2000
let BACK_BUTTON_PRESSED_ONCE_TO_EXIT = false

const hwBackButtonHandler = () => {
  if (BACK_BUTTON_PRESSED_ONCE_TO_EXIT) {
    Actions.pop()
    return false
  }

  BACK_BUTTON_PRESSED_ONCE_TO_EXIT = true
  ToastAndroid.show(s.strings.back_button_tap_again_to_exit, ToastAndroid.SHORT)

  setTimeout(() => {
    BACK_BUTTON_PRESSED_ONCE_TO_EXIT = false
  }, ANDROID_TIME_INTERVAL_BACK_BUTTON)

  return true
}

export default hwBackButtonHandler
