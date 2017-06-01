export const OPEN_TRANSACTION_ALERT = 'OPEN_TRANSACTION_ALERT'
export const CLOSE_TRANSACTION_ALERT = 'CLOSE_TRANSACTION_ALERT'

export const openTransactionAlert = (message) => {
  return {
    type: OPEN_TRANSACTION_ALERT,
    data: { message }
  }
}

export const closeTransactionAlert = () => {
  return {
    type: CLOSE_TRANSACTION_ALERT
  }
}
