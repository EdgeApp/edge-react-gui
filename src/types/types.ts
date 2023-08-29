import { asObject, asString } from 'cleaners'
import {
  EdgeCurrencyWallet,
  EdgeDenomination,
  EdgeMetadata,
  EdgeSpendTarget,
  EdgeSwapQuote,
  EdgeSwapRequest,
  EdgeToken,
  EdgeTransaction,
  JsonObject
} from 'edge-core-js/types'

import { LocaleStringKey } from '../locales/en_US'
import { RootState } from './reduxTypes'
import { Theme } from './Theme'

export interface BooleanMap {
  [key: string]: boolean
}
export interface NumberMap {
  [key: string]: number
}
export interface StringMap {
  [key: string]: string
}
export interface MapObject<T> {
  [key: string]: T
}

export type GuiDenomination = EdgeDenomination
export interface GuiCurrencyInfo {
  walletId: string
  pluginId?: string
  tokenId?: string
  displayCurrencyCode: string
  exchangeCurrencyCode: string
  displayDenomination: GuiDenomination
  exchangeDenomination: GuiDenomination
}

export interface GuiContact {
  hasThumbnail: boolean
  emailAddresses: string[]
  postalAddresses: string[]
  middleName: string
  company: string
  jobTitle: string
  familyName: string
  thumbnailPath: string
  recordID: string
  givenName: string
}

/**
 * An EdgeSwapQuote, but with amounts pretty-printed.
 */
export interface GuiSwapInfo {
  quote: EdgeSwapQuote
  request: EdgeSwapRequest

  // Formatted amounts:
  fee: string
  fromDisplayAmount: string
  fromFiat: string
  fromTotalFiat: string
  toDisplayAmount: string
  toFiat: string
}

export interface ExchangeData {
  primaryDisplayAmount: string
  primaryDisplayName: string
  secondaryDisplayAmount: string
  secondaryCurrencyCode: string
}

export interface CreateWalletType {
  currencyName: string
  walletType: string
  pluginId: string
  currencyCode: string
}

export interface CustomNodeSetting {
  isEnabled: boolean
  nodesList: string[]
}

export interface GuiFiatType {
  label: string
  value: string
}

export interface FlatListItem<T> {
  index: number
  item: T
}

export interface DeviceDimensions {
  keyboardHeight: number
}

export interface GuiTouchIdInfo {
  isTouchEnabled: boolean
  isTouchSupported: boolean
}

export interface GuiReceiveAddress {
  metadata: EdgeMetadata
  publicAddress: string
  legacyAddress?: string
  segwitAddress?: string
  nativeAmount: string
}

export type FlipInputFieldInfo = GuiCurrencyInfo & {
  nativeAmount?: string
  displayAmount?: string
}

export interface CurrencyConverter {
  convertCurrency: (state: RootState, currencyCode: string, isoFiatCurrencyCode: string, balanceInCryptoDisplay: string) => number
}

export const emptyGuiDenomination: GuiDenomination = {
  name: '',
  symbol: '',
  multiplier: '',
  // @ts-expect-error
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

export interface PasswordReminder {
  needsPasswordCheck: boolean
  lastPasswordUseDate: number
  passwordUseCount: number
  nonPasswordLoginsCount: number
  nonPasswordDaysLimit: number
  nonPasswordLoginsLimit: number
}

export interface SpendingLimits {
  transaction: {
    isEnabled: boolean
    amount: number
  }
}

export type SpendAuthType = 'pin' | 'none'

export interface GuiExchangeRates {
  [pair: string]: string
}

export interface CountryData {
  name: string
  'alpha-2': string
  'alpha-3': string
  filename?: string
}

export const asMostRecentWallet = asObject({
  id: asString,
  currencyCode: asString
})

export type MostRecentWallet = ReturnType<typeof asMostRecentWallet>

export interface FioAddress {
  name: string
  bundledTxs: number
  walletId: string
}

export interface FioDomain {
  name: string
  expiration: string
  isPublic: boolean
  walletId: string
  isFree?: boolean
}

export interface FioPublicDomain {
  domain: string
  free: boolean
}

export interface FioRequest {
  fio_request_id: number
  content: {
    payee_public_address: string
    amount: string
    token_code: string
    chain_code: string
    memo: string
  }
  payee_fio_address: string
  payer_fio_address: string
  payer_fio_public_key: string
  status: string
  time_stamp: string
  fioWalletId?: string
}

export interface FioConnectionWalletItem {
  key: string
  id: string
  edgeWallet: EdgeCurrencyWallet
  symbolImage?: string
  name: string
  currencyCode: string
  chainCode: string
  fullCurrencyCode: string
  isConnected: boolean
}

export interface FioObtRecord {
  payer_fio_address: string
  payee_fio_address: string
  payer_fio_public_key: string
  payee_fio_public_key: string
  content: {
    obt_id: string | null
    memo: string | null
  }
  fio_request_id: number
  status: string
  time_stamp: string
}

export type FeeOption = 'custom' | 'high' | 'low' | 'standard'

export interface GuiMakeSpendInfo {
  currencyCode?: string
  metadata?: any
  nativeAmount?: string
  networkFeeOption?: FeeOption
  customNetworkFee?: JsonObject
  publicAddress?: string
  spendTargets?: EdgeSpendTarget[]
  lockInputs?: boolean
  uniqueIdentifier?: string
  otherParams?: JsonObject
  dismissAlert?: boolean
  fioAddress?: string
  fioPendingRequest?: FioRequest
  isSendUsingFioAddress?: boolean
  onBack?: () => void
  onDone?: (error: Error | null, edgeTransaction?: EdgeTransaction) => void
  beforeTransaction?: () => Promise<void>
  alternateBroadcast?: (edgeTransaction: EdgeTransaction) => Promise<EdgeTransaction>
}

export interface WcConnectionInfo {
  dAppName: string
  dAppUrl: string
  expiration: string
  walletName: string
  walletId: string
  uri: string
  icon: string
}
export interface WalletConnectChainId {
  namespace: 'algorand' | 'eip155'
  reference: string
}
export interface wcGetConnection {
  chainId: number
  language?: string
  peerId: string
  peerMeta: {
    description: string
    icons: string[]
    name: string
    url: string
  }
  token?: string
  uri: string
  timeConnected: number
}
export interface AppConfig {
  appId?: string
  appName: string
  appNameShort: string
  appStore: string
  backupAccountSite: string
  configName: string
  darkTheme: Theme
  defaultWallets: string[]
  knowledgeBase: string
  lightTheme: Theme
  notificationServers: string[]
  phoneNumber: string
  referralServers?: string[]
  supportsEdgeLogin: boolean
  supportEmail: string
  supportSite: string
  termsOfServiceSite: string
  website: string
  disableSwaps?: boolean
  extraTab?: {
    webviewUrl: string
    tabTitleKey: LocaleStringKey
    extraTabBarIconFont: string
    extraTabBarIconName: string
  }
}

/**
 * We maintain a sorted wallet list in redux,
 * since it's quite expensive to calculate.
 */
export interface WalletListItem {
  key: string

  // These will be set for token rows:
  token?: EdgeToken
  tokenId?: string

  // The wallet will be present once it loads:
  wallet?: EdgeCurrencyWallet
  walletId: string
}

export interface EdgeTokenId {
  pluginId: string
  tokenId?: string
}

export interface TempActionDisplayInfo {
  title: string
  message: string
  complete: boolean
  steps?: TempActionDisplayInfo[]
}
