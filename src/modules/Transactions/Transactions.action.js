export const UPDATE_TRANSACTIONS_LIST = 'UPDATE_TRANSACTIONS_LIST'
export const DELETE_TRANSACTIONS_LIST = 'DELETE_TRANSACTIONS_LIST'
export const TRANSACTIONS_SEARCH_VISIBLE = 'TRANSACTIONS_SEARCH_VISIBLE'
export const TRANSACTIONS_SEARCH_HIDDEN = 'TRANSACTIONS_SEARCH_HIDDEN'
export const UPDATE_CONTACTS_LIST = 'UPDATE_CONTACTS_LIST'
export const UPDATE_SEARCH_RESULTS = 'UPDATE_SEARCH_RESULTS'

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
