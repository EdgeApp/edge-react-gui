// abcWalletTxLib-btc.js
import { FakeTxPrivate } from './FakeTxPrivate.js'
import { FakeTxEngine } from './FakeTxEngine.js'

export const FakeTx = {
  getInfo: () => {
    const currencyDetails = FakeTxPrivate.getInfo

    return currencyDetails
  },

  createMasterKeys: (protocol) => {
    const masterKeys = [
      'master_private_key',
      'master_public_key'
    ]

    return masterKeys
  },

  makeEngine: (abcTxLibAccess, options, callbacks) => {
    const fakeTxEngine = new FakeTxEngine(abcTxLibAccess, options, callbacks)

    return fakeTxEngine
  }
}
