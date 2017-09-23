export const OPEN_TRANSACTION_ALERT = 'OPEN_TRANSACTION_ALERT'
export const CLOSE_TRANSACTION_ALERT = 'CLOSE_TRANSACTION_ALERT'

export const openTransactionAlert = (message) => ({
  type: OPEN_TRANSACTION_ALERT,
  data: {message}
})

export const closeTransactionAlert = () => ({
  type: CLOSE_TRANSACTION_ALERT
})
