/* eslint-disable flowtype/require-valid-file-annotation */

import { ToastAndroid } from 'react-native'
export default {
  alert: message => ToastAndroid.show(message, ToastAndroid.SHORT)
}
