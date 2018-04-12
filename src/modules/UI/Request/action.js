/* eslint-disable flowtype/require-valid-file-annotation */

export const UPDATE_RECEIVE_ADDRESS = 'UPDATE_RECEIVE_ADDRESS'
export const UPDATE_AMOUNT_REQUESTED_IN_CRYPTO = 'UPDATE_AMOUNT_REQUESTED_IN_CRYPTO'
export const UPDATE_AMOUNT_RECEIVED_IN_CRYPTO = 'UPDATE_AMOUNT_RECEIVED_IN_CRYPTO'
export const UPDATE_AMOUNT_REQUESTED_IN_FIAT = 'UPDATE_AMOUNT_REQUESTED_IN_FIAT'
export const UPDATE_RECEIVE_ADDRESS_SUCCESS = 'UPDATE_RECEIVE_ADDRESS_SUCCESS'

export function updateAmountRequestedInCrypto (amountSatoshi) {
  return {
    type: UPDATE_AMOUNT_REQUESTED_IN_CRYPTO,
    data: { amountSatoshi }
  }
}

export function updateAmountRequestedInFiat (amountFiat) {
  return {
    type: UPDATE_AMOUNT_REQUESTED_IN_FIAT,
    data: { amountFiat }
  }
}
