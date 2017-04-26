import {updateWalletTransferList} from './WalletTransferList.action'

const wallets = [
  {
    walletId: "das8234sd9",
    walletName: "ehtJunk",
    walletType: "wallet:ethereum", //wallet:repo:bitcoin wallet:repo:bitcoin-bip44 wallet:repo:bitcoin-bip44-multisig wallet:repo:com.mydomain.myapp.myDataStoreType
    keys: {

    },
    dataStore: {

    },
    localDataStore: {

    },
    tx: { getBalance () { return 941 } }
  },{
    walletId: "234osdaflkj",
    walletName: "btcTest",
    walletType: "wallet:bitcoin",
    tx: { getBalance () { return 57367 } }
  },{
    walletId: "f8k02kf83j",
    walletName: "multisigSample",
    walletType: "wallet:bitcoin-bip44-multisig",
    tx: { getBalance () { return 4455 } }
  }
];

export const fakeGetWallets = () => {
  console.log('in fakeGetWallets, wallets is: ', wallets)
  return Promise.resolve(wallets)
}

export const getWalletTransferList = () => {
  return (dispatch, getState, imports) => {
    console.log('in getWalletTransferList, fakeGetWallets is: ', fakeGetWallets)
    fakeGetWallets().then( wallets => {
      return dispatch(updateWalletTransferList(wallets))
    })
  }
}
