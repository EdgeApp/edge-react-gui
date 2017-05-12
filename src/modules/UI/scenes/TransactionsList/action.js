export const UPDATE_TRANSACTIONS_LIST = 'UPDATE_TRANSACTIONS_LIST'
export const DELETE_TRANSACTIONS_LIST = 'DELETE_TRANSACTIONS_LIST'
export const TRANSACTIONS_SEARCH_VISIBLE = 'TRANSACTIONS_SEARCH_VISIBLE'
export const TRANSACTIONS_SEARCH_HIDDEN = 'TRANSACTIONS_SEARCH_HIDDEN'
export const UPDATE_CONTACTS_LIST = 'UPDATE_CONTACTS_LIST'
export const UPDATE_SEARCH_RESULTS = 'UPDATE_SEARCH_RESULTS'
export const ENABLE_UPDATING_BALANCE = 'ENABLE_UPDATING_BALANCE'
export const DISABLE_UPDATING_BALANCE = 'DISABLE_UPDATING_BALANCE'
export const TOGGLE_UPDATING_BALANCE = 'TOGGLE_UPDATING_BALANCE'

export function updateTransactionsList (data) {
  return {
    type: UPDATE_TRANSACTIONS_LIST,
    data
  }
}

export function deleteTransactionsList () {
  return {
    type: DELETE_TRANSACTIONS_LIST
  }
}

export function transactionsSearchVisible () {
  return {
    type: TRANSACTIONS_SEARCH_VISIBLE
  }
}

export function transactionsSearchHidden () {
  return {
    type: TRANSACTIONS_SEARCH_HIDDEN
  }
}

export function updateContactsList(data) {
  return {
    type: UPDATE_CONTACTS_LIST,
    data
  }
}

export function updateSearchResults (data) {
  return {
    type: UPDATE_SEARCH_RESULTS,
    data
  }
}

export function updatingBalance(data) {
  console.log('inside updatingBalance, data is: ', data)
  let type = [data] + '_UPDATING_BALANCE'
  return {
    type
  }
}