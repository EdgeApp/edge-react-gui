// @flow

import { Actions } from 'react-native-router-flux'
import { Alert } from 'react-native'

import * as SETTINGS_API from '../../../Core/Account/settings.js'
import { getAccount } from '../../../Core/selectors.js'
import { newSpendingLimits } from '../../Settings/spendingLimits/spendingLimits.js'
import { checkPassword } from '../../../Core/Account/api.js'

import type { Dispatch, GetState } from '../../../ReduxTypes.js'

export type SpendingLimits = {
  transaction: {
    isEnabled: boolean,
    amount: number
  }
}

export const setSpendingLimits = (spendingLimits: SpendingLimits, password: string) => (dispatch: Dispatch, getState: GetState) => {
  const state = getState()
  const account = getAccount(state)

  Promise.resolve()
    .then(() => checkPassword(account, password))
    .then(isAuthorized => {
      if (!isAuthorized) return Alert.alert('Incorrect password')

      return SETTINGS_API.setSpendingLimits(account, spendingLimits).then(() => {
        dispatch(newSpendingLimits(spendingLimits))
        Actions.pop()
      })
    })
}
