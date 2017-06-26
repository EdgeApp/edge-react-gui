export const UPDATE_RECEIVE_ADDRESS = 'UPDATE_RECEIVE_ADDRESS'
export const UPDATE_AMOUNT_REQUESTED_IN_CRYPTO = 'UPDATE_AMOUNT_REQUESTED_IN_CRYPTO'
export const UPDATE_AMOUNT_RECEIVED_IN_CRYPTO = 'UPDATE_AMOUNT_RECEIVED_IN_CRYPTO'
export const UPDATE_AMOUNT_REQUESTED_IN_FIAT = 'UPDATE_AMOUNT_REQUESTED_IN_FIAT'
export const UPDATE_RECEIVE_ADDRESS_SUCCESS = 'UPDATE_RECEIVE_ADDRESS_SUCCESS'

// export function updateReceiveAddress () {
//   return (dispatch, getState) => {
//     const {
//       wallets:
//         { byId },
//       ui: {
//         wallets:
//           { selectedWalletId }
//     } } = getState()
//     const wallet = byId[selectedWalletId]
//     wallet.getReceiveAddress().then(
//       receiveAddress => {
//         console.log('receiveAddress', receiveAddress)
//         return {
//           type: UPDATE_RECEIVE_ADDRESS,
//           data: { receiveAddress }
//         }
//       }
//     )
//   }
// }

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
