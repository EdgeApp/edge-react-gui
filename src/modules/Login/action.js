import { addAccount } from '../Core/Account/action.js'
import { updateWallets } from '../Core/Wallets/action.js'

export const initializeAccount = account => {
  return dispatch => {
    dispatch(addAccount(account))
    const supportedTypes = [
      'wallet:shitcoin'
    ]
    let allKeys = account.allKeys

    const keyInfos = allKeys.filter(keyInfo => {
      return supportedTypes.includes(keyInfo.type)
    })

    console.log('keyInfos', keyInfos)

    dispatch(updateWallets(keyInfos))
  }
}

// const activateWalletId = id => {
//   return {
//     type: ACTIVATE_WALLET_ID,
//     data: { id }
//   }
// }
//
// const archiveWallet = wallet => {
//   wallet.stopEngine()
//   return (dispatch, getState) => {
//     dispatch(archiveWalletId(wallet.id))
//   }
// }
//
// const archiveWalletId = id => {
//   return {
//     type: ARCHIVE_WALLET_ID,
//     data: {
//       id
//     }
//   }
// }
//
// export const addWallet = wallet => {
//   return {
//     type: ADD_WALLET,
//     data: { wallet }
//   }
// }
