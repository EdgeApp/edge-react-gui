// @flow
// import { renameWalletStart } from ''
import type {AbcMetadata} from 'airbitz-core-types'

export const renameWalletRequest = (wallet: any, name: string) => wallet.renameWallet(name)
  .then(() => {
    Promise.resolve(wallet)
  })

export const getTransactions = (wallet: any, currencyCode: string) => wallet.getTransactions({currencyCode})

export const setTransactionDetailsRequest = (wallet: any, txid: string, currencyCode: string, abcMetadata: AbcMetadata) =>
  // console.log('wallet is: ', wallet)
  // console.log('currencyCode is: ', currencyCode)
  // console.log('transactionDetails: ', transactionDetails)
  //  parameters should be txid, currencyCode, and then metaData
   wallet.saveTxMetadata(txid, currencyCode, abcMetadata)

export const getReceiveAddress = (wallet: any, currencyCode: string) => wallet.getReceiveAddress(currencyCode)

export const makeSpend = (wallet: any, spendInfo: any) =>
  // console.log('spendInfo', spendInfo)
   wallet.makeSpend(spendInfo)

export const getBalance = (wallet: any, currencyCode: string) => {
  const balance = wallet.getBalance({currencyCode})
  return balance
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
