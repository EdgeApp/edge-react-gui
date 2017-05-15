import { FakeTxEnginePrivate } from './FakeTxEnginePrivate.js'

export class FakeTxEngine {
  constructor (abcTxLibAccess, options, callbacks) {
    FakeTxEnginePrivate.init(abcTxLibAccess, options, callbacks)
  }

  killEngine () {
    // disconnect network connections
    // clear caches

    return true
  }

  test () {
    return FakeTxEnginePrivate
  }

  // synchronous
  getBlockHeight () {
    return FakeTxEnginePrivate.getBlockHeight()
  }

  // asynchronous
  enableTokens (tokens = {}) {
    return Promise.resolve(FakeTxEnginePrivate.enableTokens(tokens))
  }

  // synchronous
  getTokenStatus () {
    return FakeTxEnginePrivate.getTokensStatus()
  }

  // synchronous
  getBalance (options = {}) {
    return FakeTxEnginePrivate.getBalance(options)
  }

  // synchronous
  getNumTransactions (options = {}) {
    return FakeTxEnginePrivate.getNumTransactions(options = {})
  }

  // asynchronous
  getTransactions (options = {}) {
    return Promise.resolve(FakeTxEnginePrivate.getTransactions(options = {}))
  }

  // synchronous
  getFreshAddress (options = {}) {
    return FakeTxEnginePrivate.getFreshAddress(options)
  }

  // synchronous
  addGapLimitAddresses (options) {
    FakeTxEnginePrivate.addGapLimitAddresses(options)
    return true
  }

  // synchronous
  isAddressUsed (options = {}) {
    return FakeTxEnginePrivate.isAddressUsed(options)
  }

  // synchronous
  makeSpend (abcSpendInfo) { // returns an ABCTransaction data structure, and checks for valid info
    return FakeTxEnginePrivate.makeSpend(abcSpendInfo)
  }

  // asynchronous
  signTx (abcTransaction) {
    return Promise.resolve(FakeTxEnginePrivate.signTx(abcTransaction))
  }

  // asynchronous
  broadcastTx (abcTransaction) {
    return Promise.resolve(true)
  }

  // asynchronous
  saveTx (abcTransaction) {
    return Promise.resolve(true)
  }
}
