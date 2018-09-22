// @flow

import * as CORE_SELECTORS from '../modules/Core/selectors'
import type { Dispatch, GetState } from '../modules/ReduxTypes'
import * as SETTINGS_ACTIONS from '../modules/UI/Settings/action.js'
export const enableOtp = () => async (dispatch: Dispatch, getState: GetState) => {
  const state = getState()
  const account = CORE_SELECTORS.getAccount(state)
  try {
    await account.enableOtp()
    dispatch(SETTINGS_ACTIONS.updateOtpInfo({ enabled: true, otpKey: account.otpKey }))
  } catch (error) {
    console.log(error)
  }
}
export const disableOtp = () => async (dispatch: Dispatch, getState: GetState) => {
  const state = getState()
  const account = CORE_SELECTORS.getAccount(state)
  try {
    await account.disableOtp()
    dispatch(SETTINGS_ACTIONS.updateOtpInfo({ enabled: false, otpKey: null, otpResetPending: false }))
  } catch (error) {
    console.log(error)
  }
}
export const keepOtp = () => async (dispatch: Dispatch, getState: GetState) => {
  const state = getState()
  const account = CORE_SELECTORS.getAccount(state)
  try {
    await account.cancelOtpReset()
    dispatch({ type: 'DISABLE_OTP_RESET' })
  } catch (error) {
    console.log(error)
  }
}
