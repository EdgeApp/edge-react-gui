// @flow

import { ToastAndroid } from 'react-native'
export default {
  alert: message => ToastAndroid.show(message, ToastAndroid.SHORT)
}
