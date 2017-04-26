  import * as ACTION from './Transactions.action'

  export const transactionsList = (state = [], action) => {
    switch (action.type) {
      case ACTION.UPDATE_TRANSACTIONS_LIST :
        return action.data
      case ACTION.DELETE_TRANSACTIONS_LIST :
        return []
      case ACTION.UPDATE_SEARCH_RESULTS :
        return action.data
      default:
        return state
    }
  }

  export const searchVisible = (state = false, action) => {
    switch (action.type) {
      case ACTION.TRANSACTIONS_SEARCH_VISIBLE :
        return true
      case ACTION.TRANSACTIONS_SEARCH_HIDDEN :
        return false
      default:
        return state
    }
  }

  export const contactsList = (state = [], action) => {
    switch (action.type) {
      case ACTION.UPDATE_CONTACTS_LIST :
        return action.data
      default:
        return state
    }
  }
