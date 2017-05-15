export const UPDATE_NEW_WALLET_NAME = 'UPDATE_NEW_WALLET_NAME'

export function updateNewWalletName (data) {
  return {
    type: UPDATE_NEW_WALLET_NAME,
    data
  }
}
