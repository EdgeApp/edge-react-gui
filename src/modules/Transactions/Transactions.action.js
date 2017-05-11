export const ADD_TRANSACTION = 'ADD_TRANSACTION'

export const addTransaction = (transaction) => {
  return {
    type: ADD_TRANSACTION,
    data: { transaction }
  }
}
