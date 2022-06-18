// @flow

import { Alert } from 'react-native'

import s from '../locales/strings.js'
import { setSpendingLimits as setSpendingLimitsSettingsApi } from '../modules/Core/Account/settings.js'
import type { Dispatch, GetState } from '../types/reduxTypes.js'
import { type NavigationProp, type ParamList } from '../types/routerTypes.js'
import type { SpendingLimits } from '../types/types.js'

export const setSpendingLimits =
  <Name: $Keys<ParamList>>(spendingLimits: SpendingLimits, password: string, navigation: NavigationProp<Name>) =>
  (dispatch: Dispatch, getState: GetState) => {
    const state = getState()
    const { account } = state.core

    account.checkPassword(password).then(isAuthorized => {
      if (!isAuthorized) return Alert.alert(s.strings.password_check_incorrect_password_title)

      return setSpendingLimitsSettingsApi(account, spendingLimits).then(() => {
        dispatch({
          type: 'SPENDING_LIMITS/NEW_SPENDING_LIMITS',
          data: { spendingLimits }
        })
        navigation.pop()
      })
    })
  }
