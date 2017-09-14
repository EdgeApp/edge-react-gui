  import * as ACTION from './action'
  import {combineReducers} from 'redux'

  const transactions = (state = [], action) => {
    const {type, data = {} } = action
    const {transactions} = data
    switch (type) {
    case ACTION.UPDATE_TRANSACTIONS:
      return transactions
    case ACTION.NEW_TRANSACTIONS:
      return [
        ...state,
        ...transactions
      ]
    case ACTION.CHANGED_TRANSACTIONS:
      return [
        ...state,
        ...transactions
      ]
    default:
      return state
    }
  }

  const searchVisible = (state = false, action) => {
    switch (action.type) {
    case ACTION.TRANSACTIONS_SEARCH_VISIBLE :
      return true
    case ACTION.TRANSACTIONS_SEARCH_HIDDEN :
      return false
    default:
      return state
    }
  }

  const contactsList = (state = [], action) => {
    switch (action.type) {
    case ACTION.UPDATE_CONTACTS_LIST :
      return action.data
    default:
      return state
    }
  }

  const updatingBalance = (state = true, action) => {
    switch (action.type) {
    case ACTION.ENABLE_UPDATING_BALANCE :
      return true
    case ACTION.DISABLE_UPDATING_BALANCE :
      return false
    case ACTION.TOGGLE_UPDATING_BALANCE :
      return !state
    default :
      return state
    }
  }

  const transactionsWalletListModalVisibility = (state = false, action) => {
    switch (action.type) {
    case ACTION.TOGGLE_TRANSACTIONS_WALLET_LIST_MODAL :
      return !state
    default:
      return state
    }
  }

  const transactionList = combineReducers({
    transactions,
    searchVisible,
    contactsList,
    updatingBalance,
    transactionsWalletListModalVisibility
  })

  export default transactionList
