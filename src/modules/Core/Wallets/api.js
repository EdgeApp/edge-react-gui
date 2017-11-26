// @flow
// import { renameWalletStart } from ''
import type {AbcMetadata, AbcCurrencyWallet, AbcSpendInfo, AbcTransaction, AbcParsedUri, AbcReceiveAddress} from 'airbitz-core-types'
import { tokens } from './Tokens.js'
export const SYNCED_TOKENS_FILENAME = 'Tokens.js'
export const SYNCED_TOKENS_DEFAULTS = {
  'CAP': {
    currencyCode: 'CAP1',
    currencyName: 'CaptainCoin',
    denominations: [
      {
        name: 'CAP1',
        multiplier: 1000
      }
    ]
  }
}

export const renameWalletRequest = (wallet: AbcCurrencyWallet, name: string) => wallet.renameWallet(name)
  .then(() => {
    Promise.resolve(wallet)
  })

export const getTransactions = (wallet: AbcCurrencyWallet, currencyCode: string): Promise<Array<AbcTransaction>> => {
  if (wallet.getTransactions) {
    return wallet.getTransactions({currencyCode})
  } else {
    return Promise.resolve([])
  }
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

export const setTransactionDetailsRequest = (wallet: AbcCurrencyWallet, txid: string, currencyCode: string, abcMetadata: AbcMetadata): Promise<void> =>
  // console.log('wallet is: ', wallet)
  // console.log('currencyCode is: ', currencyCode)
  // console.log('transactionDetails: ', transactionDetails)
  //  parameters should be txid, currencyCode, and then metaData
   wallet.saveTxMetadata ? wallet.saveTxMetadata(txid, currencyCode, abcMetadata): Promise.resolve()

export const getReceiveAddress = (wallet: AbcCurrencyWallet, currencyCode: string): Promise<AbcReceiveAddress> => {
  if (wallet.getReceiveAddress) {
    return wallet.getReceiveAddress(currencyCode)
  } else {
    return Promise.resolve(dummyAbcReceiveAddress)
  }
}

export const makeSpend = (wallet: AbcCurrencyWallet, spendInfo: AbcSpendInfo): Promise<AbcTransaction> => {
  // console.log('spendInfo', spendInfo)
  if (wallet.makeSpend) {
    return wallet.makeSpend(spendInfo)
  } else {
    return Promise.resolve(dummyAbcTransaction)
  }
}

export const getMaxSpendable = (wallet: AbcCurrencyWallet, spendInfo: AbcSpendInfo): Promise<string> => {
  if (wallet.getMaxSpendable) {
    return wallet.getMaxSpendable(spendInfo)
  } else {
    return Promise.resolve('0')
  }
}

export const getBalance = (wallet: AbcCurrencyWallet, currencyCode: string): string => {
  if (wallet.getBalance) {
    return wallet.getBalance({currencyCode})
  } else {
    return '0'
  }
}

export const enableTokens = (wallet: AbcCurrencyWallet, tokens: Array<string>) =>
  // XXX need to hook up to Core -paulvp
   wallet.enableTokens(tokens)

export const addCustomToken = (wallet: AbcCurrencyWallet, tokenName: string, tokenCode: string, tokenDenomination: string) => {
  let tokens = getSyncedTokens(wallet)

  const incomingToken = {
    enabled: true,
    currencyCode: 'CAP1',
    currencyName: 'CaptainCoin',
    denominations: [
      {
        name: 'CAP1',
        multiplier: tokenDenomination
      }
    ]
  }
  tokens[tokenCode] = incomingToken
  setSyncedTokens(wallet, tokens)
  .then(() => {
    tokens
  })
}

export const getSyncedTokensTemp = (wallet: AbcCurrencyWallet) => {
  return tokens
}

export const setSyncedTokensTemp = (wallet: AbcCurrencyWallet, tokens: any) => {
  return tokens
}

export const getSyncedTokens = (wallet: AbcCurrencyWallet) => {
  let tokenFile = getSyncedTokensFile(wallet)
  tokenFile.getText()
  .then((text) => {
    let tokensText = JSON.parse(text)
    return tokensText.tokens
  })
  .catch(() => {
    setSyncedTokens(wallet, SYNCED_TOKENS_DEFAULTS)
    .then(() => {
      SYNCED_TOKENS_DEFAULTS
    })
  })
}

export const getSyncedTokensFile = (wallet: AbcCurrencyWallet) => {
  wallet.folder.file(SYNCED_TOKENS_FILENAME)
}

export async function setSyncedTokens (wallet: AbcCurrencyWallet, tokens: any) {
  let finalText = {}
  finalText = tokens
  const tokensFile = getSyncedTokensFile(wallet)
  let stringifiedTokens = JSON.stringify(finalText)
  try {
    await tokensFile.setText(stringifiedTokens)
  } catch (e) {
    console.log('error writing tokens: ', e)
  }
}

export const parseURI = (wallet: AbcCurrencyWallet, uri: string): AbcParsedUri => wallet.parseUri(uri)

export const signTransaction = (wallet: AbcCurrencyWallet, unsignedTransaction: AbcTransaction): Promise<AbcTransaction> => wallet.signTx(unsignedTransaction)

export const broadcastTransaction = (wallet: AbcCurrencyWallet, signedTransaction: AbcTransaction): Promise<AbcTransaction> => wallet.broadcastTx(signedTransaction)

export const saveTransaction = (wallet: AbcCurrencyWallet, signedTransaction: AbcTransaction): Promise<void> => wallet.saveTx(signedTransaction)

// Documented but not implemented in the core
// Do not use for Glidera transactions
// export const signBroadcastAndSaveTransaction = (wallet:any, unsignedTransaction:any) => {
//   return wallet.signBroadcastAndSaveTransactionTx(unsignedTransaction)
// }
