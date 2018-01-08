// @flow

import type {Dispatch, GetState} from '../../../ReduxTypes'

import {
  updateTransactionSpendingLimitStart,
  updateTransactionSpendingLimitSuccess,
  updateTransactionSpendingLimitError,
  updateDailySpendingLimitStart,
  updateDailySpendingLimitSuccess,
  updateDailySpendingLimitError
} from '../../Settings/action.js'

import * as CORE_SELECTORS from '../../../Core/selectors'
import * as SETTINGS_API from '../../../Core/Account/settings'

export const updateTransactionSpendingLimit = (currencyCode: string, isEnabled: boolean, transactionSpendingLimit: string) => (dispatch: Dispatch, getState: GetState) => {
  dispatch(updateTransactionSpendingLimitStart(currencyCode, isEnabled, transactionSpendingLimit))

  const state = getState()
  const account = CORE_SELECTORS.getAccount(state)

  return SETTINGS_API.setTransactionSpendingLimitRequest(account, currencyCode, isEnabled, transactionSpendingLimit)
    .then((settings) => {
      console.log(settings)
      dispatch(updateTransactionSpendingLimitSuccess(currencyCode, isEnabled, transactionSpendingLimit))
    })
    .catch((error) => {
      dispatch(updateTransactionSpendingLimitError(error))
    })
}

export const updateDailySpendingLimit = (currencyCode: string, isEnabled: boolean, dailySpendingLimit: string) => (dispatch: Dispatch, getState: GetState) => {
  dispatch(updateDailySpendingLimitStart(currencyCode, isEnabled,dailySpendingLimit))

  const state = getState()
  const account = CORE_SELECTORS.getAccount(state)

  return SETTINGS_API.setDailySpendingLimitRequest(account, currencyCode, isEnabled, dailySpendingLimit)
  .then((settings) => {
    console.log(settings)
    dispatch(updateDailySpendingLimitSuccess(currencyCode, isEnabled, dailySpendingLimit))
  })
  .catch((error) => {
    dispatch(updateDailySpendingLimitError(error))
  })
}
