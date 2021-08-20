// @flow

import { Alert } from 'react-native'

import s from '../locales/strings.js'
import * as SETTINGS_API from '../modules/Core/Account/settings.js'
import type { Dispatch, GetState } from '../types/reduxTypes.js'
import { Actions } from '../types/routerTypes.js'
import type { SpendingLimits } from '../types/types.js'

export const setSpendingLimits = (spendingLimits: SpendingLimits, password: string) => (dispatch: Dispatch, getState: GetState) => {
  const state = getState()
  const { account } = state.core

  account.checkPassword(password).then(isAuthorized => {
    if (!isAuthorized) return Alert.alert(s.strings.password_check_incorrect_password_title)

    return SETTINGS_API.setSpendingLimits(account, spendingLimits).then(() => {
      dispatch({
        type: 'SPENDING_LIMITS/NEW_SPENDING_LIMITS',
        data: { spendingLimits }
      })
      Actions.pop()
    })
  })
}
