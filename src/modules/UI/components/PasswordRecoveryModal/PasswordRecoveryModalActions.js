// @flow

import { bns } from 'biggystring'
import { Actions } from 'react-native-router-flux'

import { RECOVER_PASSWORD } from '../../../../constants/indexConstants.js'
import { getSyncedSettingsAsync, setSyncedSettingsAsync } from '../../../Core/Account/settings.js'
import type { Dispatch, GetState } from '../../../ReduxTypes.js'
import { tallyUpTotalCrypto } from '../../../utils.js'
import { updateSettings as updateReduxSettings } from '../../Settings/action.js'

export const SHOW_PASSWORD_RECOVERY_MODAL = 'SHOW_PASSWORD_RECOVERY_MODAL'
export const HIDE_PASSWORD_RECOVERY_MODAL = 'HIDE_PASSWORD_RECOVERY_MODAL'

export const checkPasswordRecovery = () => async (dispatch: Dispatch, getState: GetState) => {
  const state = getState()
  const settings = state.ui.settings
  const account = state.core.account
  const passwordRecoveryRemindersShown = { ...settings.passwordRecoveryRemindersShown }
  const totalDollars = tallyUpTotalCrypto(state)
  const isPasswordRecoverySetup = !!account.recoveryKey
  for (const level in passwordRecoveryRemindersShown) {
    if (isPasswordRecoverySetup) return
    if (bns.lt(totalDollars, level)) return // if balance is not big enough to trigger then exit routine
    if (passwordRecoveryRemindersShown[level] === true) continue // if it's already been shown then go to higher level
    // now show the modal
    dispatch(showPasswordRecoveryModal())
    passwordRecoveryRemindersShown[level] = true
    const syncedSettings = await getSyncedSettingsAsync(account)
    const newSyncedSettings = { ...syncedSettings, passwordRecoveryRemindersShown }
    await setSyncedSettingsAsync(account, newSyncedSettings)
    dispatch(
      updateReduxSettings({
        ...settings,
        passwordRecoveryRemindersShown
      })
    )
    return
  }
}

export const showPasswordRecoveryModal = () => {
  return {
    type: SHOW_PASSWORD_RECOVERY_MODAL
  }
}

export const hidePasswordRecoveryModal = () => {
  return {
    type: HIDE_PASSWORD_RECOVERY_MODAL
  }
}

export const onGoToPasswordRecoveryScene = () => (dispatch: Dispatch, getState: GetState) => {
  dispatch(hidePasswordRecoveryModal())
  Actions[RECOVER_PASSWORD]()
}
