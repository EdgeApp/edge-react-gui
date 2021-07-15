// @flow

import { OtpError } from 'edge-core-js'
import { Actions } from 'react-native-router-flux'

import { OTP_REPAIR_SCENE } from '../constants/SceneKeys.js'
import { type Dispatch, type GetState } from '../types/reduxTypes.js'

export const handleOtpError = (otpError: OtpError) => (dispatch: Dispatch, getState: GetState) => {
  const state = getState()
  const { account, otpErrorShown } = state.core

  if (account.loggedIn && !otpErrorShown) {
    dispatch({ type: 'OTP_ERROR_SHOWN' })
    Actions.push(OTP_REPAIR_SCENE, {
      otpError
    })
  }
}
