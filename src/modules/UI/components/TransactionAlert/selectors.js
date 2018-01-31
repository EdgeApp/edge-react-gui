// @flow

import type {State} from '../../../ReduxTypes'

export const getTransaction = (state: State) => {
  return state.ui.transactionAlert.abcTransaction
}

export const getDisplayAlert = (state: State) => {
  return state.ui.transactionAlert.displayAlert
}
