// @flow

import type {AbcMetadata, AbcCurrencyWallet, AbcSpendInfo, AbcTransaction, AbcParsedUri, AbcReceiveAddress} from 'airbitz-core-types'
import _ from 'lodash'
const ENABLED_TOKENS_FILENAME = 'EnabledTokens.json'

export const renameWalletRequest = (wallet: AbcCurrencyWallet, name: string) => {
  return wallet.renameWallet(name)
  .then(() => wallet)
}

export const getTransactions = (wallet: AbcCurrencyWallet, currencyCode: string): Promise<Array<AbcTransaction>> => {
  return wallet.getTransactions ? wallet.getTransactions({currencyCode}) : Promise.resolve([])
}

const dummyAbcTransaction: AbcTransaction = {
  txid: '',
  date: 0,
  currencyCode: '',
  blockHeight: 0,
  nativeAmount: '0',
  networkFee: '0',
  ourReceiveAddresses: [],
  signedTx: '',
  metadata: {},
  otherParams: {}
}

const dummyAbcReceiveAddress: AbcReceiveAddress = {
  publicAddress: '',
  metadata: {},
  nativeAmount: ''
}

export const setTransactionDetailsRequest = (wallet: AbcCurrencyWallet, txid: string, currencyCode: string, abcMetadata: AbcMetadata): Promise<void> => {
  return wallet.saveTxMetadata ? wallet.saveTxMetadata(txid, currencyCode, abcMetadata) : Promise.resolve()
}

export const getReceiveAddress = (wallet: AbcCurrencyWallet, currencyCode: string): Promise<AbcReceiveAddress> => {
  return wallet.getReceiveAddress ? wallet.getReceiveAddress(currencyCode) : Promise.resolve(dummyAbcReceiveAddress)
}

export const makeSpend = (wallet: AbcCurrencyWallet, spendInfo: AbcSpendInfo): Promise<AbcTransaction> => {
  return wallet.makeSpend ? wallet.makeSpend(spendInfo) : Promise.resolve(dummyAbcTransaction)
}

export const getMaxSpendable = (wallet: AbcCurrencyWallet, spendInfo: AbcSpendInfo): Promise<string> => {
  return wallet.getMaxSpendable ? wallet.getMaxSpendable(spendInfo) : Promise.resolve('0')
}

export const getBalance = (wallet: AbcCurrencyWallet, currencyCode: string): string => {
  return wallet.getBalance ? wallet.getBalance({currencyCode}) : '0'
}

export const disableTokens = (wallet: AbcCurrencyWallet, tokens: Array<string>) => {
  return wallet.disableTokens(tokens)
}

export const enableTokens = (wallet: AbcCurrencyWallet, tokens: Array<string>) => {
  return wallet.enableTokens(tokens)
}

export const addCoreCustomToken = (wallet: AbcCurrencyWallet, tokenObj: any) => {
  return wallet.addCustomToken(tokenObj)
  .then(() => wallet.enableTokens([tokenObj.currencyCode]))
  .catch((e) => console.log(e))
}

export const getEnabledTokensFromFile = async (wallet: AbcCurrencyWallet): Promise<Array<any>> => {
  try {
    const tokensText = await getEnabledTokensFile(wallet).getText()
    const tokens = JSON.parse(tokensText)
    return tokens
  } catch (e) {
    console.log(e)
    return setEnabledTokens(wallet, [])
  }
}

export const getEnabledTokensFile = (wallet: AbcCurrencyWallet) => {
  const folder = wallet.folder
  const file = folder.file(ENABLED_TOKENS_FILENAME)
  return file
}

export async function setEnabledTokens (wallet: AbcCurrencyWallet, tokens: Array<string>, tokensToDisable?: Array<string>) {  // initialize array for eventual setting of file
  const finalTextArray = [...tokens]
  // now stringify the new tokens
  const stringifiedTokens = JSON.stringify(finalTextArray)
  // grab the enabledTokensFile
  const tokensFile = getEnabledTokensFile(wallet)
  await tokensFile.setText(stringifiedTokens)
  enableTokens(wallet, tokens)
  if (tokensToDisable && tokensToDisable.length > 0) {
    disableTokens(wallet, tokensToDisable)
  }
  return tokens
}

export async function updateEnabledTokens (wallet: AbcCurrencyWallet, tokensToEnable: Array<string>, tokensToDisable: Array<string>) {
  const tokensFile = getEnabledTokensFile(wallet)
  try {
    const tokensText = await tokensFile.getText()
    const enabledTokens = JSON.parse(tokensText)
    const tokensWithNewTokens = _.union(tokensToEnable, enabledTokens)
    const finalTokensToEnable = _.difference(tokensWithNewTokens, tokensToDisable)
    await enableTokens(wallet, finalTokensToEnable)
    await disableTokens(wallet, tokensToDisable)
    console.log('updateEnabledTokens setText', finalTokensToEnable)
    await tokensFile.setText(JSON.stringify(finalTokensToEnable))
  } catch (e) {
    console.log(e)
  }
}

export const parseURI = (wallet: AbcCurrencyWallet, uri: string): AbcParsedUri => {
  return wallet.parseUri(uri)
}

export const signTransaction = (wallet: AbcCurrencyWallet, unsignedTransaction: AbcTransaction): Promise<AbcTransaction> => {
  return wallet.signTx(unsignedTransaction)
}

export const broadcastTransaction = (wallet: AbcCurrencyWallet, signedTransaction: AbcTransaction): Promise<AbcTransaction> => {
  return wallet.broadcastTx(signedTransaction)
}

export const saveTransaction = (wallet: AbcCurrencyWallet, signedTransaction: AbcTransaction): Promise<void> => {
  return wallet.saveTx(signedTransaction)
}

export const resyncWallet = (wallet: AbcCurrencyWallet): Promise<void> => {
  return wallet.resyncBlockchain()
}

export const getDisplayPrivateSeed = (wallet: AbcCurrencyWallet): String => {
  return wallet.getDisplayPrivateSeed()
}

// Documented but not implemented in the core
// Do not use for Glidera transactions
// export const signBroadcastAndSaveTransaction = (wallet:any, unsignedTransaction:any) => {
//   return wallet.signBroadcastAndSaveTransactionTx(unsignedTransaction)
// }
