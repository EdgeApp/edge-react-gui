// @flow
// import { renameWalletStart } from ''
import { makeCurrencyWallet } from 'airbitz-core-js'
import { makeWalletCallbacks } from './callbacks.js'
import * as CORE_SELECTORS from '../../Core/selectors.js'
import * as SETTINGS_SELECTORS from '../../UI/Settings/selectors.js'

export const makeCurrencyWalletRequest = (keyInfo: any, dispatch: any, getState: any) => {
  const state = getState()
  const account = CORE_SELECTORS.getAccount(state)
  const io = CORE_SELECTORS.getIO(state)
  const walletType = keyInfo.type.replace('wallet:', '').toLowerCase()

  let matchingPlugin = null

  for (const madePlugin of SETTINGS_SELECTORS.getPlugins(state).arrayPlugins) {
    for (const type of madePlugin.currencyInfo.walletTypes) {
      if (walletType.replace('wallet:', '').toLowerCase() === type.replace('wallet:', '')) {
        matchingPlugin = madePlugin
        break
      }
    }
    if (matchingPlugin) {
      break
    }
  }

  if (!matchingPlugin) {
    return Promise.reject('NoMatchingPluginError')
  }

  const walletId = keyInfo.id
  const callbacks = makeWalletCallbacks(dispatch, walletId)
  const opts = {
    account,
    plugin: matchingPlugin,
    callbacks,
    io
  }

  return makeCurrencyWallet(keyInfo, opts)
}

export const renameWalletRequest = (wallet: any, name: string) => {
  return wallet.renameWallet(name)
  .then(() => {
    Promise.resolve(wallet)
  })
}

export const activateWalletRequest = (wallet: any) => {
  return wallet.startEngine()
  .then(() => {
    wallet.archived = false
    wallet.deleted = false
    return Promise.resolve(wallet)
  })
}

export const archiveWalletRequest = (wallet: any) => {
  return wallet.stopEngine()
  .then(() => {
    wallet.archived = true
    wallet.deleted = false
    return Promise.resolve(wallet)
  })
}

export const getTransactions = (wallet: any, currencyCode: string) => {
  return wallet.getTransactions({ currencyCode })
}

export const setTransactionDetailsRequest = (wallet: any, currencyCode: string, transactionDetails: any) => {
  console.log('wallet is: ', wallet)
  console.log('currencyCode is: ', currencyCode)
  console.log('transactionDetails: ', transactionDetails)
  //  parameters should be txid, currencyCode, and then metaData
  return wallet.saveTxMetadata(transactionDetails.txid, currencyCode, transactionDetails)
}

export const getReceiveAddress = (wallet: any, currencyCode: string) => {
  return wallet.getReceiveAddress(currencyCode)
}

export const makeSpend = (wallet: any, spendInfo: any) => {
  console.log('spendInfo', spendInfo)
  return wallet.makeSpend(spendInfo)
}

export const getBalance = (wallet: any, currencyCode: string) => {
  const balance = wallet.getBalance({ currencyCode })
  return balance
}

export const enableTokens = (wallet: any, tokens: Array<string>) => {
  // XXX need to hook up to Core -paulvp
  return wallet.enableTokens(tokens)
}

export const parseURI = (wallet: any, uri: string) => {
  return wallet.parseUri(uri)
}

export const signTransaction = (wallet: any, unsignedTransaction: any) => {
  return wallet.signTx(unsignedTransaction)
}

export const broadcastTransaction = (wallet: any, signedTransaction: any) => {
  return wallet.broadcastTx(signedTransaction)
}

export const saveTransaction = (wallet: any, signedTransaction: any) => {
  return wallet.saveTx(signedTransaction)
}

// Documented but not implemented in the core
// Do not use for Glidera transactions
// export const signBroadcastAndSaveTransaction = (wallet:any, unsignedTransaction:any) => {
//   return wallet.signBroadcastAndSaveTransactionTx(unsignedTransaction)
// }
