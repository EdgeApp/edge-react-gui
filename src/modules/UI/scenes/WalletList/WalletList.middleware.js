import {updateWalletOrder, updateWalletListOrder} from './WalletList.action'

export const forceWalletListUpdate = (order, list) => {
    const walletOrder = order
    const walletList = list
    const walletOrderWithIds = []

    for (let prop of order) {
      walletOrderWithIds.push(list[parseInt(prop)].id)
    }
    dispatch(updateWalletListOrder(walletOrderWithIds))
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