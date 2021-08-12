// @flow

import { Alert } from 'react-native'

import { CURRENCY_SETTINGS } from '../constants/SceneKeys'
import s from '../locales/strings.js'
import { setSpendingLimits as setSpendingLimitsSettings } from '../modules/Core/Account/settings.js'
import { spendingLimits as spendingLimitsReducer } from '../reducers/SpendingLimitsReducer.js'
import type { Dispatch, GetState } from '../types/reduxTypes.js'
import { Actions } from '../types/routerTypes.js'
import type { SpendingLimits } from '../types/types.js'

export const setSpendingLimits =
  (spendingLimits: SpendingLimits, password: string, currencyCode?: string, fiatCurrencyCode?: string) => async (dispatch: Dispatch, getState: GetState) => {
    const state = getState()
    const { account } = state.core

    const isAuthorized = await account.checkPassword(password)
    if (!isAuthorized) return Alert.alert(s.strings.password_check_incorrect_password_title)

    const action = {
      type: 'SPENDING_LIMITS/NEW_SPENDING_LIMITS',
      data: { spendingLimits, currencyCode, fiatCurrencyCode }
    }

    await setSpendingLimitsSettings(account, spendingLimitsReducer(state.ui.settings.spendingLimits, action))
    dispatch(action)

    if (currencyCode && fiatCurrencyCode) {
      Actions.popTo(CURRENCY_SETTINGS)
    } else {
      Actions.pop()
    }
  }
