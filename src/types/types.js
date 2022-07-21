// @flow

import { asArray, asObject, asOptional, asString } from 'cleaners'
import {
  type EdgeCurrencyWallet,
  type EdgeDenomination,
  type EdgeMetadata,
  type EdgeMetaToken,
  type EdgeSpendTarget,
  type EdgeSwapQuote,
  type EdgeSwapRequest,
  type EdgeToken,
  type EdgeTransaction
} from 'edge-core-js/types'

import { type RootState } from './reduxTypes.js'
import { type Theme } from './Theme.js'

export type GuiWallet = {|
  id: string,
  type: string,
  name: string,
  pluginId: string,
  primaryNativeBalance: string,
  nativeBalances: { [currencyCode: string]: string },
  currencyNames: { [currencyCode: string]: string },
  currencyCode: string,
  isoFiatCurrencyCode: string,
  fiatCurrencyCode: string,
  metaTokens: EdgeMetaToken[],
  enabledTokens: string[],
  addressLoadingProgress?: number,
  blockHeight: number | null
|}

// FIXME: Bandaid for when the GuiWallet object isn't quite ready when some components are loaded
export const asSafeDefaultGuiWallet = (guiWallet: GuiWallet): GuiWallet => ({
  ...asOptional(
    asObject({
      name: asOptional(asString, ''),
      currencyNames: asOptional(asObject(asString), {}),
      currencyCode: asOptional(asString, ''),
      enabledTokens: asOptional(asArray(asString), [])
    })
  )(guiWallet),
  ...guiWallet
})

export type GuiDenomination = EdgeDenomination
export type GuiCurrencyInfo = {
  walletId: string,
  pluginId?: string,
  tokenId?: string,
  displayCurrencyCode: string,
  exchangeCurrencyCode: string,
  displayDenomination: GuiDenomination,
  exchangeDenomination: GuiDenomination
}

export type GuiContact = {
  hasThumbnail: boolean,
  emailAddresses: string[],
  postalAddresses: string[],
  middleName: string,
  company: string,
  jobTitle: string,
  familyName: string,
  thumbnailPath: string,
  recordID: string,
  givenName: string
}

/**
 * An EdgeSwapQuote, but with amounts pretty-printed.
 */
export type GuiSwapInfo = {
  quote: EdgeSwapQuote,
  request: EdgeSwapRequest,

  // Formatted amounts:
  fee: string,
  fromDisplayAmount: string,
  fromFiat: string,
  fromTotalFiat: string,
  toDisplayAmount: string,
  toFiat: string
}

export type ExchangeData = {
  primaryDisplayAmount: string,
  primaryDisplayName: string,
  secondaryDisplayAmount: string,
  secondaryCurrencyCode: string
}

export type CreateWalletType = {
  currencyName: string,
  walletType: string,
  pluginId: string,
  currencyCode: string
}

export type CustomNodeSetting = {
  isEnabled: boolean,
  nodesList: string[]
}

export type GuiFiatType = {
  label: string,
  value: string
}

export type TransactionListTx = EdgeTransaction & {
  dateString: string,
  key: number,
  time: string,
  unfilteredIndex: number
}

export type FlatListItem<T> = {
  index: number,
  item: T
}

export type DeviceDimensions = {
  keyboardHeight: number
}

export type GuiTouchIdInfo = {
  isTouchEnabled: boolean,
  isTouchSupported: boolean
}

export type GuiReceiveAddress = {
  metadata: EdgeMetadata,
  publicAddress: string,
  legacyAddress?: string,
  segwitAddress?: string,
  nativeAmount: string
}

export type FlipInputFieldInfo = GuiCurrencyInfo & {
  nativeAmount?: string,
  displayAmount?: string
}

export type SubcategorySearchResultData = {
  index: number,
  item: string,
  separators: Object
}

export type CurrencyConverter = {
  convertCurrency: (state: RootState, currencyCode: string, isoFiatCurrencyCode: string, balanceInCryptoDisplay: string) => number
}

export const emptyGuiDenomination: GuiDenomination = {
  name: '',
  symbol: '',
  multiplier: '',
  precision: 0,
  currencyCode: ''
}
export const emptyCurrencyInfo: GuiCurrencyInfo = {
  walletId: '',
  displayCurrencyCode: '',
  exchangeCurrencyCode: '',
  displayDenomination: emptyGuiDenomination,
  exchangeDenomination: emptyGuiDenomination
}

export type PasswordReminder = {
  needsPasswordCheck: boolean,
  lastPasswordUseDate: number,
  passwordUseCount: number,
  nonPasswordLoginsCount: number,
  nonPasswordDaysLimit: number,
  nonPasswordLoginsLimit: number
}

export type SpendingLimits = {
  transaction: {
    isEnabled: boolean,
    amount: number
  }
}

export type SpendAuthType = 'pin' | 'none'

export type GuiExchangeRates = {
  [pair: string]: string
}

export type CountryData = {
  name: string,
  'alpha-2': string,
  filename?: string
}

export const asMostRecentWallet = asObject({
  id: asString,
  currencyCode: asString
})

export type MostRecentWallet = $Call<typeof asMostRecentWallet>

export type FioAddress = {
  name: string,
  bundledTxs: number,
  walletId: string
}

export type FioDomain = {
  name: string,
  expiration: string,
  isPublic: boolean,
  walletId: string,
  isFree?: boolean
}

export type FioPublicDomain = {
  domain: string,
  free: boolean
}

export type FioRequest = {
  fio_request_id: string,
  content: {
    payee_public_address: string,
    amount: string,
    token_code: string,
    chain_code: string,
    memo: string
  },
  payee_fio_address: string,
  payer_fio_address: string,
  payer_fio_public_key: string,
  status: string,
  time_stamp: string,
  fioWalletId?: string
}

export type FioConnectionWalletItem = {
  key: string,
  id: string,
  edgeWallet: EdgeCurrencyWallet,
  symbolImage: string,
  name: string,
  currencyCode: string,
  chainCode: string,
  fullCurrencyCode: string,
  isConnected: boolean
}

export type FioObtRecord = {
  payer_fio_address: string,
  payee_fio_address: string,
  payer_fio_public_key: string,
  payee_fio_public_key: string,
  content: {
    obt_id: string | null,
    memo: string | null
  },
  fio_request_id: number,
  status: string,
  time_stamp: string
}

export type FeeOption = 'custom' | 'high' | 'low' | 'standard'

export type GuiMakeSpendInfo = {
  currencyCode?: string,
  metadata?: any,
  nativeAmount?: string,
  networkFeeOption?: FeeOption,
  customNetworkFee?: Object,
  publicAddress?: string,
  spendTargets?: EdgeSpendTarget[],
  lockInputs?: boolean,
  uniqueIdentifier?: string,
  otherParams?: Object,
  dismissAlert?: boolean,
  fioAddress?: string,
  fioPendingRequest?: FioRequest,
  isSendUsingFioAddress?: boolean,
  onBack?: () => void,
  onDone?: (error: Error | null, edgeTransaction?: EdgeTransaction) => void,
  beforeTransaction?: () => Promise<void>,
  alternateBroadcast?: (edgeTransaction: EdgeTransaction) => Promise<EdgeTransaction>
}

export type WcConnectionInfo = {
  dAppName: string,
  dAppUrl: string,
  timeConnected: string,
  walletName: string,
  walletId: string,
  uri: string,
  icon: string
}
export type wcGetConnection = {
  chainId: number,
  language?: string,
  peerId: string,
  peerMeta: {
    description: string,
    icons: string[],
    name: string,
    url: string
  },
  token?: string,
  uri: string,
  timeConnected: number
}
export type AppConfig = {
  configName: string,
  appId?: string,
  appName: string,
  appNameShort: string,
  darkTheme: Theme,
  lightTheme: Theme,
  referralServers?: string[],
  notificationServers: string[],
  supportsEdgeLogin: boolean,
  knowledgeBase: string,
  supportSite: string,
  phoneNumber: string,
  website: string,
  termsOfServiceSite: string,
  appStore: string,
  defaultWallets: string[]
}

/**
 * We maintain a sorted wallet list in redux,
 * since it's quite expensive to calculate.
 */
export type WalletListItem = {|
  key: string,

  // These will be set for token rows:
  token?: EdgeToken,
  tokenId?: string,

  // The wallet will be present once it loads:
  wallet?: EdgeCurrencyWallet,
  walletId: string
|}

export type EdgeTokenId = {
  pluginId: string,
  tokenId?: string
}

export type TempActionDisplayInfo = {
  title: string,
  message: string,
  complete: boolean,
  steps?: TempActionDisplayInfo[]
}
