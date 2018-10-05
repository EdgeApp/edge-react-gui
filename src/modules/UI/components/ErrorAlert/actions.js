// @flow
import { Alert } from 'react-native'

import s from '../../../../locales/strings.js'
import type { Dispatch } from '../../../../modules/ReduxTypes'

export const displayErrorAlertStore = (message: string) => ({
  type: 'UI/COMPONENTS/ERROR_ALERT/DISPLAY_ERROR_ALERT',
  data: { message }
})

export const displayErrorAlert = (message: string) => (dispatch: Dispatch) => {
  if (message === 'Invalid OTP token') {
    Alert.alert(s.strings.otp_out_of_sync_title, s.strings.otp_out_of_sync_body)
    return
  }
  dispatch({
    type: 'UI/COMPONENTS/ERROR_ALERT/DISPLAY_ERROR_ALERT',
    data: { message }
  })
}

export const dismissErrorAlert = () => ({
  type: 'UI/COMPONENTS/ERROR_ALERT/DISMISS_ERROR_ALERT',
  data: { message: '' }
})
