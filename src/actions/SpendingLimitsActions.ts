import { Alert } from 'react-native'

import s from '../locales/strings'
import { setSpendingLimits as setSpendingLimitsSettingsApi } from '../modules/Core/Account/settings'
import { ThunkAction } from '../types/reduxTypes'
import { Actions } from '../types/routerTypes'
import { SpendingLimits } from '../types/types'

export function setSpendingLimits(spendingLimits: SpendingLimits, password: string): ThunkAction<void> {
  return (dispatch, getState) => {
    const state = getState()
    const { account } = state.core

    account.checkPassword(password).then(isAuthorized => {
      if (!isAuthorized) return Alert.alert(s.strings.password_check_incorrect_password_title)

      return setSpendingLimitsSettingsApi(account, spendingLimits).then(() => {
        dispatch({
          type: 'SPENDING_LIMITS/NEW_SPENDING_LIMITS',
          data: { spendingLimits }
        })
        Actions.pop()
      })
    })
  }
}
