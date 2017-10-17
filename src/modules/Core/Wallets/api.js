// @flow
// import { renameWalletStart } from ''
import type {AbcMetadata} from 'airbitz-core-types'

export const renameWalletRequest = (wallet: any, name: string) => wallet.renameWallet(name)
  .then(() => {
    Promise.resolve(wallet)
  })

export const getTransactions = (wallet: any, currencyCode: string) => {
  if (wallet.getTransactions) {
    return wallet.getTransactions({currencyCode})
  } else {
    return Promise.resolve([])
  }
}

export const setTransactionDetailsRequest = (wallet: any, txid: string, currencyCode: string, abcMetadata: AbcMetadata) =>
  // console.log('wallet is: ', wallet)
  // console.log('currencyCode is: ', currencyCode)
  // console.log('transactionDetails: ', transactionDetails)
  //  parameters should be txid, currencyCode, and then metaData
   wallet.saveTxMetadata ? wallet.saveTxMetadata(txid, currencyCode, abcMetadata) : Promise.resolve()

export const getReceiveAddress = (wallet: any, currencyCode: string) => {
  if (wallet.getReceiveAddress) {
    return wallet.getReceiveAddress(currencyCode)
  } else {
    return Promise.resolve('')
  }
}

export const makeSpend = (wallet: any, spendInfo: any) => {
  // console.log('spendInfo', spendInfo)
  if (wallet.makeSpend) {
    return wallet.makeSpend(spendInfo)
  } else {
    return Promise.resolve({})
  }
}

export const getMaxSpendable = (wallet: any, spendInfo: any) => {
  if (wallet.getMaxSpendable) {
    return wallet.getMaxSpendable(spendInfo)
  } else {
    return Promise.resolve('0')
  }
}

export const getBalance = (wallet: any, currencyCode: string) => {
  if (wallet.getBalance) {
    return wallet.getBalance({currencyCode})
  } else {
    return 0
  }
}

export const enableTokens = (wallet: any, tokens: Array<string>) =>
  // XXX need to hook up to Core -paulvp
   wallet.enableTokens(tokens)

export const parseURI = (wallet: any, uri: string) => wallet.parseUri(uri)

export const signTransaction = (wallet: any, unsignedTransaction: any) => wallet.signTx(unsignedTransaction)

export const broadcastTransaction = (wallet: any, signedTransaction: any) => wallet.broadcastTx(signedTransaction)

export const saveTransaction = (wallet: any, signedTransaction: any) => wallet.saveTx(signedTransaction)

// Documented but not implemented in the core
// Do not use for Glidera transactions
// export const signBroadcastAndSaveTransaction = (wallet:any, unsignedTransaction:any) => {
//   return wallet.signBroadcastAndSaveTransactionTx(unsignedTransaction)
// }
