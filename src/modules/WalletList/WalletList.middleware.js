import {updateWalletOrder, updateWalletListOrder} from './WalletList.action'

export const forceWalletListUpdate = (order, list) => {
    const walletOrder = order
    const walletList = list
    return (dispatch, getState) => {
        startWalletOrderUpdate(walletOrder, dispatch).then( () => {
            let newWalletList = walletList.sort(walletReSortWrapper(walletOrder, walletList))
            dispatch(updateWalletListOrder(walletOrder, newWalletList))
        })
    }
  }

export const walletReSort = ( a, b) => {
    if(walletOrder[walletList.indexOf(a)] < walletOrder[walletList.indexOf(b)]) {
      return -1
    } else if(walletOrder[walletList.indexOf(a)] > walletOrder[walletList.indexOf(b)]) {
      return 1
    } else {
      return 0
    }
  }

export const startWalletOrderUpdate = (walletOrder, dispatch) => new Promise((resolve, reject) => {
    dispatch(updateWalletOrder(walletOrder))
    resolve()
})

export const walletReSortWrapper = (order, list) => {
    return function (a, b)  {
        if(order[list.indexOf(a)] < order[list.indexOf(b)]) {
            return -1
        } else if(order[list.indexOf(a)] > order[list.indexOf(b)]) {
            return 1
        } else {
            return 0
        }
    }
}