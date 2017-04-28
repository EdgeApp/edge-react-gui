export const ADD_RECEIVE_ADDRESS = 'ADD_RECEIVE_ADDRESS'
export const UPDATE_AMOUNT_REQUESTED_IN_CRYPTO = 'UPDATE_AMOUNT_REQUESTED_IN_CRYPTO'
export const UPDATE_AMOUNT_RECEIVED_IN_CRYPTO = 'UPDATE_AMOUNT_RECEIVED_IN_CRYPTO'

export function addReceiveAddress (receiveAddress) {
  return {
    type: ADD_RECEIVE_ADDRESS,
    receiveAddress
  }
}

export function updateAmountRequestedInCrypto (amountRequestedInCrypto) {
  return {
    type: UPDATE_AMOUNT_REQUESTED_IN_CRYPTO,
    amountRequestedInCrypto
  }
}

export function updateAmountReceivedInCrypto (amountReceivedInCrypto) {
  return {
    type: UPDATE_AMOUNT_RECEIVED_IN_CRYPTO,
    amountReceivedInCrypto
  }
}
