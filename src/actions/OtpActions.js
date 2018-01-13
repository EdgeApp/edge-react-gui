// @flow
import type {Dispatch, GetState} from '../modules/ReduxTypes'
import * as SETTINGS_ACTIONS from '../modules/UI/Settings/action.js'
import * as CORE_SELECTORS from '../modules/Core/selectors'
export const enableOtp = () => async (dispatch: Dispatch, getState: GetState) => {
  const state = getState()
  const account = CORE_SELECTORS.getAccount(state)
  try {
    await account.enableOtp()
    // console.log(account.otpKey)
    dispatch(SETTINGS_ACTIONS.updateOtpInfo({enabled: true, otpKey: account.otpKey}))
  } catch (e) {
    console.log(e)
  }
}
export const disableOtp = () => async (dispatch: Dispatch, getState: GetState) => {
  const state = getState()
  const account = CORE_SELECTORS.getAccount(state)
  try {
    await account.disableOtp()
    dispatch(SETTINGS_ACTIONS.updateOtpInfo({enabled: false, otpKey: null}))
  } catch (e) {
    console.log(e)
  }
}
