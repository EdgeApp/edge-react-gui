import { Alert } from 'react-native'

import { lstrings } from '../locales/strings'
import { setSpendingLimits as setSpendingLimitsSettingsApi } from '../modules/Core/Account/settings'
import { ThunkAction } from '../types/reduxTypes'
import { NavigationBase } from '../types/routerTypes'
import { SpendingLimits } from '../types/types'

export function setSpendingLimits(navigation: NavigationBase, spendingLimits: SpendingLimits, password: string): ThunkAction<Promise<void>> {
  return async (dispatch, getState) => {
    const state = getState()
    const { account } = state.core

    const isAuthorized = await account.checkPassword(password)
    if (!isAuthorized) return Alert.alert(lstrings.password_check_incorrect_password_title)

    await setSpendingLimitsSettingsApi(account, spendingLimits)
    dispatch({
      type: 'SPENDING_LIMITS/NEW_SPENDING_LIMITS',
      data: { spendingLimits }
    })
    navigation.pop()
  }
}
