// @flow

import type { EdgeCurrencyWallet, EdgeMetadata, EdgeParsedUri, EdgePaymentProtocolInfo, EdgeReceiveAddress, EdgeSpendInfo, EdgeTransaction } from 'edge-core-js'
import _ from 'lodash'
const ENABLED_TOKENS_FILENAME = 'EnabledTokens.json'

const BITPAY = {
  domain: 'bitpay.com',
  merchantName: (memo: string) => {
    // Example BitPay memo
    // "Payment request for BitPay invoice DKffym7WxX6kzJ73yfYS7s for merchant Electronic Frontier Foundation"
    // eslint-disable-next-line no-unused-vars
    const [_, merchantName] = memo.split(' for merchant ')
    return merchantName
  }
}

export const renameWalletRequest = (wallet: EdgeCurrencyWallet, name: string) => {
  return wallet.renameWallet(name).then(() => wallet)
}

export const getNumTransactions = (wallet: EdgeCurrencyWallet, currencyCode: string): number => {
  return wallet.getNumTransactions ? wallet.getNumTransactions({ currencyCode }) : 0
}

export const getTransactions = (wallet: EdgeCurrencyWallet, currencyCode: string, options?: Object): Promise<Array<EdgeTransaction>> => {
  return wallet.getTransactions ? wallet.getTransactions({ ...options, currencyCode }) : Promise.resolve([])
}

const dummyEdgeTransaction: EdgeTransaction = {
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

const dummyEdgeReceiveAddress: EdgeReceiveAddress = {
  publicAddress: '',
  nativeAmount: '0',
  metadata: {
    amountFiat: 0
  }
}

export const setTransactionDetailsRequest = (wallet: EdgeCurrencyWallet, txid: string, currencyCode: string, edgeMetadata: EdgeMetadata): Promise<mixed> => {
  return wallet.saveTxMetadata ? wallet.saveTxMetadata(txid, currencyCode, edgeMetadata) : Promise.resolve()
}

export const getReceiveAddress = (wallet: EdgeCurrencyWallet, currencyCode: string): Promise<EdgeReceiveAddress> => {
  return wallet.getReceiveAddress ? wallet.getReceiveAddress({ currencyCode }) : Promise.resolve(dummyEdgeReceiveAddress)
}

export const makeSpendInfo = (paymentProtocolInfo: EdgePaymentProtocolInfo): Promise<EdgeSpendInfo> => {
  const { domain, memo, merchant, nativeAmount, spendTargets } = paymentProtocolInfo

  const name = domain === BITPAY.domain ? BITPAY.merchantName(memo) : merchant || domain
  const notes = memo

  return Promise.resolve({
    networkFeeOption: 'standard',
    metadata: {
      name,
      notes
    },
    nativeAmount,
    spendTargets
  })
}

export const getPaymentProtocolInfo = (wallet: EdgeCurrencyWallet, paymentProtocolUrl: string): Promise<EdgePaymentProtocolInfo> => {
  return Promise.resolve(paymentProtocolUrl).then(wallet.getPaymentProtocolInfo)
}

export const makeSpend = (wallet: EdgeCurrencyWallet, spendInfo: EdgeSpendInfo): Promise<EdgeTransaction> => {
  return wallet.makeSpend ? wallet.makeSpend(spendInfo) : Promise.resolve(dummyEdgeTransaction)
}

export const getMaxSpendable = (wallet: EdgeCurrencyWallet, spendInfo: EdgeSpendInfo): Promise<string> => {
  return wallet.getMaxSpendable ? wallet.getMaxSpendable(spendInfo) : Promise.resolve('0')
}

export const getBalance = (wallet: EdgeCurrencyWallet, currencyCode: string): string => {
  return wallet.getBalance ? wallet.getBalance({ currencyCode }) : '0'
}

export const disableTokens = (wallet: EdgeCurrencyWallet, tokens: Array<string>) => {
  return wallet.disableTokens(tokens)
}

export const enableTokens = (wallet: EdgeCurrencyWallet, tokens: Array<string>) => {
  return wallet.enableTokens(tokens)
}

export const addCoreCustomToken = (wallet: EdgeCurrencyWallet, tokenObj: any) => {
  return wallet
    .addCustomToken(tokenObj)
    .then(() => wallet.enableTokens([tokenObj.currencyCode]))
    .catch(e => console.log(e))
}

export const getEnabledTokensFromFile = async (wallet: EdgeCurrencyWallet): Promise<Array<any>> => {
  try {
    const tokensText = await getEnabledTokensFile(wallet).getText()
    const tokens = JSON.parse(tokensText)
    return tokens
  } catch (e) {
    console.log(e)
    return setEnabledTokens(wallet, [])
  }
}

export const getEnabledTokensFile = (wallet: EdgeCurrencyWallet) => {
  const folder = wallet.folder
  const file = folder.file(ENABLED_TOKENS_FILENAME)
  return file
}

export async function setEnabledTokens (wallet: EdgeCurrencyWallet, tokens: Array<string>, tokensToDisable?: Array<string>) {
  // initialize array for eventual setting of file
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

export async function updateEnabledTokens (wallet: EdgeCurrencyWallet, tokensToEnable: Array<string>, tokensToDisable: Array<string>) {
  const tokensFile = getEnabledTokensFile(wallet)
  try {
    const tokensText = await tokensFile.getText()
    const enabledTokens = JSON.parse(tokensText)
    const tokensWithNewTokens = _.union(tokensToEnable, enabledTokens)
    const finalTokensToEnable = _.difference(tokensWithNewTokens, tokensToDisable)
    await enableTokens(wallet, finalTokensToEnable)
    await disableTokens(wallet, tokensToDisable)
    await tokensFile.setText(JSON.stringify(finalTokensToEnable))
  } catch (e) {
    console.log(e)
  }
}

export const parseURI = (wallet: EdgeCurrencyWallet, uri: string): EdgeParsedUri => {
  return wallet.parseUri(uri)
}

export const parseUriAsync = (wallet: EdgeCurrencyWallet, uri: string): Promise<EdgeParsedUri> => {
  try {
    return Promise.resolve(wallet.parseUri(uri))
  } catch (error) {
    return Promise.reject(error)
  }
}
export const parseUri = parseUriAsync

export const signTransaction = (wallet: EdgeCurrencyWallet, unsignedTransaction: EdgeTransaction): Promise<EdgeTransaction> => {
  return wallet.signTx(unsignedTransaction)
}

export const broadcastTransaction = (wallet: EdgeCurrencyWallet, signedTransaction: EdgeTransaction): Promise<EdgeTransaction> => {
  return wallet.broadcastTx(signedTransaction)
}

export const saveTransaction = (wallet: EdgeCurrencyWallet, signedTransaction: EdgeTransaction): Promise<mixed> => {
  return wallet.saveTx(signedTransaction)
}

export const resyncWallet = (wallet: EdgeCurrencyWallet): Promise<mixed> => {
  return wallet.resyncBlockchain()
}

export const getDisplayPrivateSeed = (wallet: EdgeCurrencyWallet): string => {
  return wallet.getDisplayPrivateSeed() || 'receive-only wallet'
}

// Documented but not implemented in the core
// Do not use for Glidera transactions
// export const signBroadcastAndSaveTransaction = (wallet:any, unsignedTransaction:any) => {
//   return wallet.signBroadcastAndSaveTransactionTx(unsignedTransaction)
// }
