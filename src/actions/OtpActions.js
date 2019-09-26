// @flow

import * as CORE_SELECTORS from '../modules/Core/selectors'
import * as SETTINGS_ACTIONS from '../modules/Settings/SettingsActions.js'
import type { Dispatch, GetState } from '../types/reduxTypes.js'

export const enableOtp = () => async (dispatch: Dispatch, getState: GetState) => {
  const state = getState()
  const account = CORE_SELECTORS.getAccount(state)
  await account.enableOtp()
  dispatch(SETTINGS_ACTIONS.updateOtpInfo({ enabled: true, otpKey: account.otpKey }))
}

export const disableOtp = () => async (dispatch: Dispatch, getState: GetState) => {
  const state = getState()
  const account = CORE_SELECTORS.getAccount(state)
  await account.disableOtp()
  dispatch(SETTINGS_ACTIONS.updateOtpInfo({ enabled: false, otpKey: null, otpResetPending: false }))
}

export const keepOtp = () => async (dispatch: Dispatch, getState: GetState) => {
  const state = getState()
  const account = CORE_SELECTORS.getAccount(state)
  await account.cancelOtpReset()
  dispatch({ type: 'DISABLE_OTP_RESET' })
}
