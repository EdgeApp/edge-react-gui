// @flow

import { bns } from 'biggystring'
import { Actions } from 'react-native-router-flux'

import { RECOVER_PASSWORD as PASSWORD_RECOVERY_SCENE } from '../../../../constants/indexConstants.js'
import { setPasswordRecoveryRemindersAsync } from '../../../Core/Account/settings.js'
import type { Dispatch, GetState } from '../../../ReduxTypes.js'
import { tallyUpTotalCrypto } from '../../../utils.js'

export const SHOW_PASSWORD_RECOVERY_MODAL = 'SHOW_PASSWORD_RECOVERY_MODAL'
export const HIDE_PASSWORD_RECOVERY_MODAL = 'HIDE_PASSWORD_RECOVERY_MODAL'
export const UPDATE_SHOW_PASSWORD_RECOVERY_REMINDER_MODAL = 'UPDATE_SHOW_PASSWORD_RECOVERY_REMINDER_MODAL'

export const checkPasswordRecovery = () => async (dispatch: Dispatch, getState: GetState) => {
  const state = getState()
  const settings = state.ui.settings
  const account = state.core.account
  const passwordRecoveryRemindersShown = settings.passwordRecoveryRemindersShown
  const isPasswordRecoverySetup = !!account.recoveryKey
  if (isPasswordRecoverySetup) return
  const totalDollars = tallyUpTotalCrypto(state)
  for (const level in passwordRecoveryRemindersShown) {
    if (bns.lt(totalDollars, level)) return // if balance is not big enough to trigger then exit routine
    if (passwordRecoveryRemindersShown[level] === true) continue // if it's already been shown then go to higher level
    // now show the modal
    dispatch(showPasswordRecoveryReminderModal())
    await setPasswordRecoveryRemindersAsync(account, level, true)
    dispatch(updateShowPasswordRecoveryReminderModal(level, true))
    return
  }
}

export const updateShowPasswordRecoveryReminderModal = (level: string, wasShown: boolean) => {
  return {
    type: UPDATE_SHOW_PASSWORD_RECOVERY_REMINDER_MODAL,
    data: {
      level,
      wasShown
    }
  }
}

export const showPasswordRecoveryReminderModal = () => {
  return {
    type: SHOW_PASSWORD_RECOVERY_MODAL
  }
}

export const hidePasswordRecoveryReminderModal = () => {
  return {
    type: HIDE_PASSWORD_RECOVERY_MODAL
  }
}

export const onGoToPasswordRecoveryScene = () => (dispatch: Dispatch, getState: GetState) => {
  dispatch(hidePasswordRecoveryReminderModal())
  Actions[PASSWORD_RECOVERY_SCENE]()
}
