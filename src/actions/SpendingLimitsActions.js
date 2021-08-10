// @flow

import { Alert } from 'react-native'

import s from '../locales/strings.js'
import { setGlobalSpendingLimits as setGlobalSpendingLimitsSettings } from '../modules/Core/Account/settings.js'
import type { Dispatch, GetState } from '../types/reduxTypes.js'
import { Actions } from '../types/routerTypes.js'
import type { SpendingLimits } from '../types/types.js'

export const setGlobalSpendingLimits = (globalSpendingLimits: SpendingLimits, password: string) => (dispatch: Dispatch, getState: GetState) => {
  const state = getState()
  const { account } = state.core

  account.checkPassword(password).then(isAuthorized => {
    if (!isAuthorized) return Alert.alert(s.strings.password_check_incorrect_password_title)

    return setGlobalSpendingLimitsSettings(account, globalSpendingLimits).then(() => {
      dispatch({
        type: 'SPENDING_LIMITS/NEW_GLOBAL_SPENDING_LIMITS',
        data: { globalSpendingLimits }
      })
      Actions.pop()
    })
  })
}
