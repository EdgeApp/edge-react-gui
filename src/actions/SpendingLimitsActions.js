// @flow

import { Alert } from 'react-native'
import { Actions } from 'react-native-router-flux'

import s from '../locales/strings.js'
import * as SETTINGS_API from '../modules/Core/Account/settings.js'
import { getAccount } from '../modules/Core/selectors.js'
import { newSpendingLimits } from '../reducers/SpendingLimitsReducer.js'
import type { Dispatch, GetState } from '../types/reduxTypes.js'
import type { SpendingLimits } from '../types/types.js'

export const setSpendingLimits = (spendingLimits: SpendingLimits, password: string) => (dispatch: Dispatch, getState: GetState) => {
  const state = getState()
  const account = getAccount(state)

  account.checkPassword(password).then(isAuthorized => {
    if (!isAuthorized) return Alert.alert(s.strings.password_check_incorrect_password_title)

    return SETTINGS_API.setSpendingLimits(account, spendingLimits).then(() => {
      dispatch(newSpendingLimits(spendingLimits))
      Actions.pop()
    })
  })
}
