export const UPDATE_TRANSACTIONS_LIST = 'UPDATE_TRANSACTIONS_LIST'
export const DELETE_TRANSACTIONS_LIST = 'DELETE_TRANSACTIONS_LIST'

export function updateTransactionsList (data) {
  return {
    type: UPDATE_TRANSACTIONS_LIST,
    data
  }
}

export function deleteTransactionsList() {
  return {
    type: DELETE_TRANSACTIONS_LIST
  }
}
