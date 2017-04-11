import * as ACTION from './Transactions.action'

export const transactionsList = (state = false, action) => {
  switch (action.type) {
    case ACTION.UPDATE_TRANSACTIONS_LIST :
      return action.data
    case ACTION.DELETE_TRANSACTIONS_LIST :
      return false
    default:
      return state
  }
}
