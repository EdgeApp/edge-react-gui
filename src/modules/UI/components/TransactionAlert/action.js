export const OPEN_TRANSACTION_ALERT = 'OPEN_TRANSACTION_ALERT'
export const CLOSE_TRANSACTION_ALERT = 'CLOSE_TRANSACTION_ALERT'

export function openTransactionAlert (message = "Transaction Received", route) {
  return {
    type: OPEN_TRANSACTION_ALERT,
    data: { message, route }
  }
}

export function closeTransactionAlert () {
  return {
    type: CLOSE_TRANSACTION_ALERT
  }
}
