// @flow

const PREFIX = 'SPENDING_LIMITS/'

export const UPDATE_PIN_SPENDING_LIMIT_START   = PREFIX + 'UPDATE_PIN_SPENDING_LIMIT'
export const UPDATE_PIN_SPENDING_LIMIT_SUCCESS = PREFIX + 'UPDATE_PIN_SPENDING_LIMIT'
export const UPDATE_PIN_SPENDING_LIMIT_ERROR   = PREFIX + 'UPDATE_PIN_SPENDING_LIMIT'

export const UPDATE_PASSWORD_SPENDING_LIMIT_START   = PREFIX + 'UPDATE_PASSWORD_SPENDING_LIMIT'
export const UPDATE_PASSWORD_SPENDING_LIMIT_SUCCESS = PREFIX + 'UPDATE_PASSWORD_SPENDING_LIMIT'
export const UPDATE_PASSWORD_SPENDING_LIMIT_ERROR   = PREFIX + 'UPDATE_PASSWORD_SPENDING_LIMIT'

import type {
  Dispatch,
  // GetState
} from '../../../ReduxTypes'

export const updatePinSpendingLimit = (currencyCode: string, spendingLimit: string) => (dispatch: Dispatch) => {
  dispatch(updatePinSpendingLimitStart(currencyCode, spendingLimit))
  // do core stuff
  Promise.resolve()
  .then(() => dispatch(updatePinSpendingLimitSuccess(currencyCode, spendingLimit)))
  .catch((error) => dispatch(updatePinSpendingLimitError(error)))
}

export const updatePinSpendingLimitStart = (currencyCode: string, spendingLimit: string) => ({
  type: UPDATE_PIN_SPENDING_LIMIT_START,
  data: {
    currencyCode,
    spendingLimit
  }
})

export const updatePinSpendingLimitSuccess = (currencyCode: string, spendingLimit: string) => ({
  type: UPDATE_PIN_SPENDING_LIMIT_SUCCESS,
  data: {
    currencyCode,
    spendingLimit
  }
})

export const updatePinSpendingLimitError = (error: Error) => ({
  type: UPDATE_PIN_SPENDING_LIMIT_ERROR,
  data: {error}
})

export const updatePasswordSpendingLimit = (currencyCode: string, spendingLimit: string) => (dispatch: Dispatch) => {
  dispatch(updatePasswordSpendingLimitStart(currencyCode, spendingLimit))
  // do core stuff
  Promise.resolve()
  .then(() => dispatch(updatePasswordSpendingLimitSuccess(currencyCode, spendingLimit)))
  .catch((error) => dispatch(updatePasswordSpendingLimitError(error)))
}

export const updatePasswordSpendingLimitStart = (currencyCode: string, spendingLimit: string) => ({
  type: UPDATE_PASSWORD_SPENDING_LIMIT_START,
  data: {
    currencyCode,
    spendingLimit
  }
})

export const updatePasswordSpendingLimitSuccess = (currencyCode: string, spendingLimit: string) => ({
  type: UPDATE_PASSWORD_SPENDING_LIMIT_SUCCESS,
  data: {
    currencyCode,
    spendingLimit
  }
})

export const updatePasswordSpendingLimitError = (error: Error) => ({
  type: UPDATE_PASSWORD_SPENDING_LIMIT_ERROR,
  data: {error}
})
