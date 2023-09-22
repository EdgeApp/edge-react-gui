import { asArray, asBoolean, asEither, asNumber, asObject, asOptional, asString, asTuple, asUnknown, asValue, Cleaner } from 'cleaners'
import { EdgeMemo, EdgeMetadata, EdgeNetworkFee, EdgeReceiveAddress, EdgeTransaction } from 'edge-core-js'

import {
  EdgeGetWalletHistoryResult,
  EdgeProviderDeepLink,
  EdgeProviderMethods,
  EdgeProviderSpendTarget,
  EdgeRequestSpendOptions,
  ExtendedCurrencyCode,
  WalletDetails
} from './edgeProviderTypes'

const asEdgeMetadata = asObject<EdgeMetadata>({
  amountFiat: asOptional(asNumber),
  bizId: asOptional(asNumber),
  category: asOptional(asString),
  exchangeAmount: asOptional(asObject(asNumber)),
  name: asOptional(asString),
  notes: asOptional(asString)
})

const asEdgeNetworkFee = asObject<EdgeNetworkFee>({
  currencyCode: asString,
  nativeAmount: asString
})

const asEdgeReceiveAddress = asObject<EdgeReceiveAddress>({
  publicAddress: asString,
  segwitAddress: asOptional(asString),
  legacyAddress: asOptional(asString),
  nativeBalance: asOptional(asString),
  segwitNativeBalance: asOptional(asString),
  legacyNativeBalance: asOptional(asString),
  metadata: asEdgeMetadata,
  nativeAmount: asString
})

const asConfirmation = asValue<['confirmed', 'unconfirmed', 'syncing', 'dropped']>('confirmed', 'unconfirmed', 'syncing', 'dropped')

const asEdgeMemo = asObject<EdgeMemo>({
  memoName: asString,
  type: asValue('hex', 'number', 'text'),
  value: asString
})

const asEdgeTransaction = asObject<EdgeTransaction>({
  walletId: asString,

  currencyCode: asString,
  nativeAmount: asString,

  // Fees:
  networkFee: asString,
  parentNetworkFee: asOptional(asString),

  // Confirmation status:
  confirmations: asOptional(asEither(asConfirmation, asNumber)),
  blockHeight: asNumber,
  date: asNumber,

  // Transaction info:
  isSend: asBoolean,
  memos: asArray(asEdgeMemo),
  ourReceiveAddresses: asArray(asString),
  signedTx: asString,
  txid: asString
})

const asExtendedCurrencyCode: Cleaner<ExtendedCurrencyCode> = asEither(
  asString,
  asObject({
    pluginId: asString,
    tokenId: asOptional(asString),
    currencyCode: asOptional(asString)
  })
)

const asWalletDetails = asObject<WalletDetails>({
  name: asString,
  pluginId: asString,
  receiveAddress: asObject({
    publicAddress: asString
  }),
  chainCode: asString,
  currencyCode: asString,
  fiatCurrencyCode: asString,
  currencyIcon: asString,
  currencyIconDark: asString
})

const asEdgeGetReceiveAddressOptions = asObject({
  metadata: asOptional(asEdgeMetadata)
})

const asEdgeGetWalletHistoryResult = asObject<EdgeGetWalletHistoryResult>({
  fiatCurrencyCode: asString,
  balance: asString,
  transactions: asArray(asEdgeTransaction)
})

const asFeeOption = asValue<['low', 'standard', 'high']>('low', 'standard', 'high')

const asEdgeRequestSpendOptions = asObject<EdgeRequestSpendOptions>({
  currencyCode: asOptional(asString),
  metadata: asOptional(asEdgeMetadata),
  networkFeeOption: asOptional(asFeeOption),
  lockInputs: asOptional(asBoolean),
  signOnly: asOptional(asBoolean),
  uniqueIdentifier: asOptional(asString),
  customNetworkFee: asOptional(asEdgeNetworkFee),
  orderId: asOptional(asString)
})

const asEdgeProviderSpendTarget = asObject<EdgeProviderSpendTarget>({
  exchangeAmount: asOptional(asString),
  nativeAmount: asOptional(asString),
  publicAddress: asOptional(asString),
  otherParams: asUnknown
})

const asEdgeProviderDeepLink = asObject<EdgeProviderDeepLink>({
  deepPath: asOptional(asString),
  deepQuery: asOptional(asObject(asEither(asString, asValue(null)))),
  promoCode: asOptional(asString)
})

const asVoid = asValue(undefined)

type CleanerPair<T> = T extends (...args: infer Params) => Promise<infer Result>
  ? {
      asParams: Cleaner<Params>
      asReturn: Cleaner<Result>
    }
  : never

type MethodTable<T> = {
  readonly [K in keyof T]: CleanerPair<T[K]>
}

export const methodCleaners: MethodTable<EdgeProviderMethods> = {
  getDeepLink: { asParams: asTuple(), asReturn: asEdgeProviderDeepLink },

  // ---- Wallet methods ----------------

  chooseCurrencyWallet: {
    asParams: asTuple(asOptional(asArray(asExtendedCurrencyCode))),
    asReturn: asExtendedCurrencyCode
  },
  getReceiveAddress: {
    asParams: asTuple(asOptional(asEdgeGetReceiveAddressOptions)),
    asReturn: asEdgeReceiveAddress
  },
  getCurrentWalletInfo: { asParams: asTuple(), asReturn: asWalletDetails },
  getWalletHistory: { asParams: asTuple(), asReturn: asEdgeGetWalletHistoryResult },
  requestSpend: {
    asParams: asTuple(asArray(asEdgeProviderSpendTarget), asOptional(asEdgeRequestSpendOptions)),
    asReturn: asVoid
  },
  requestSpendUri: {
    asParams: asTuple(asString, asOptional(asEdgeRequestSpendOptions)),
    asReturn: asVoid
  },
  signMessage: { asParams: asTuple(asString), asReturn: asString },

  // ---- Storage methods ----------------

  writeData: {
    asParams: asTuple(asObject(asOptional(asString))),
    asReturn: asVoid
  },
  readData: {
    asParams: asTuple(asArray(asString)),
    asReturn: asObject(asOptional(asString))
  },

  // ---- Display methods ----------------

  consoleLog: { asParams: asTuple(asString), asReturn: asVoid },
  displayError: { asParams: asTuple(asString), asReturn: asVoid },
  displayToast: { asParams: asTuple(asString), asReturn: asVoid },
  hasSafariView: { asParams: asTuple(), asReturn: asBoolean },
  openURL: { asParams: asTuple(asString), asReturn: asVoid },
  openEmailApp: { asParams: asTuple(asString), asReturn: asVoid },
  openSafariView: { asParams: asTuple(asString), asReturn: asVoid },

  // ---- Navigation methods ----------------

  exitPlugin: { asParams: asTuple(), asReturn: asVoid },
  restartPlugin: { asParams: asTuple(), asReturn: asVoid }
} as const
