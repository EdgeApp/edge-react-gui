import { FakeTx } from './index.js'

export class FakeWallet {
  constructor (walletType, walletName, walletKeys, walletId, dataStore, localDataStore, tx) {
    this.walletId = walletId
    this.walletType = walletType
    this.walletName = walletName
    this.keys = walletKeys
    this.dataStore = dataStore
    this.localDataStore = localDataStore
    this.tx = tx
  }

  // async
  renameWallet (walletName) {
    this.walletName = walletName

    return Promise.resolve(walletName)
  }

  // async
  addTxFunctionality () {
    this.tx = FakeTx
  }
}
