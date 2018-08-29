// @flow
import { Alert } from 'react-native'

import * as actions from '../../../../actions/indexActions.js'
import s from '../../../../locales/strings.js'
import type { Dispatch } from '../../../../modules/ReduxTypes'

const PREFIX = 'UI/components/ErrorAlert/'
export const DISPLAY_ERROR_ALERT = PREFIX + 'DISPLAY_ERROR_ALERT'
export const DISMISS_ERROR_ALERT = PREFIX + 'DISMISS_ERROR_ALERT'

export const displayErrorAlertStore = (message: string) => ({
  type: DISPLAY_ERROR_ALERT,
  data: { message }
})
export const displayErrorAlert = (message: string) => (dispatch: Dispatch) => {
  if (message === 'Invalid OTP token') {
    Alert.alert(s.strings.otp_out_of_sync_title, s.strings.otp_out_of_sync_body)
    return
  }
  dispatch(actions.dispatchActionObject(DISPLAY_ERROR_ALERT, { message }))
}

export const dismissErrorAlert = () => ({
  type: DISMISS_ERROR_ALERT,
  data: { message: '' }
})
