import { asArray, asBoolean, asDate, asEither, asMaybe, asNull, asNumber, asObject, asOptional, asString, asValue } from 'cleaners'
import { EdgeCurrencyWallet, EdgeMetadata, EdgeToken, EdgeTokenId } from 'edge-core-js/types'

import { LocaleStringKey } from '../locales/en_US'
import { RootState } from './reduxTypes'
import { Theme } from './Theme'

/** @deprecated Only to be used for payloads that still allow undefined for
 *  tokenId such as notification server
 */
export const asLegacyTokenId = asOptional(asString, null)

export const asEdgeTokenId = asEither(asString, asNull)
export const asEdgeAsset = asObject({
  pluginId: asString,
  tokenId: asEdgeTokenId
})
export const asEdgeCurrencyCode = asObject({
  pluginId: asString,
  currencyCode: asString
})

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

export interface CustomNodeSetting {
  isEnabled: boolean
  nodesList: string[]
}

export interface GuiFiatType {
  label: string
  value: string
}

// @deprecated use ListRenderItemInfo from FlashList or FlatList components
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

export interface CurrencyConverter {
  convertCurrency: (state: RootState, currencyCode: string, isoFiatCurrencyCode: string, balanceInCryptoDisplay: string) => number
}

const asPasswordReminder = asObject({
  needsPasswordCheck: asMaybe(asBoolean, false),
  lastLoginDate: asMaybe(asNumber, 0),
  lastPasswordUseDate: asMaybe(asNumber, 0),
  passwordUseCount: asMaybe(asNumber, 0),
  nonPasswordLoginsCount: asMaybe(asNumber, 0),
  nonPasswordDaysLimit: asMaybe(asNumber, 4),
  nonPasswordLoginsLimit: asMaybe(asNumber, 4)
})

const asTransaction = asObject({
  amount: asMaybe(asNumber, 0),
  isEnabled: asMaybe(asBoolean, false)
})

export const asSpendingLimits = asObject({
  transaction: asMaybe(asTransaction, () => asTransaction({}))
})

const asAccountNotifDismissInfo = asObject({
  ip2FaNotifShown: asMaybe(asBoolean, false)
})
export type AccountNotifDismissInfo = ReturnType<typeof asAccountNotifDismissInfo>

const asTokenWarningsShown = asArray(asString)

export interface NotifInfo {
  /**
   * Timestamp that this notification was detected locally. May accept
   * server-side date values in future iterations.
   */
  dateReceived: Date

  /** Whether the user has dismissed the bottom `NotificationView` banner */
  isBannerHidden: boolean

  /**
   * True if user "completed" the requested action. This may be as simple as
   * tapping and reading the notification, but may be more complex, such as
   * requiring 2FA toggled on.
   */
  isCompleted: boolean

  /**
   * True to pin this notification to the top of the `NotificationCenterScene`
   */
  isPriority: boolean

  /**
   * Optional object that holds additional parameters that may be used to
   * customize the notification UI.
   */
  params?: {
    walletId?: string
    /**
     * Optional object that holds information about a promo card notification.
     * Used when a promo card is dismissed from the home screen and added to the notification center.
     */
    promoCard?: {
      /** Unique ID for the promo card */
      messageId: string

      /** Title to display in the notification center */
      title: string

      /** Body text to display in the notification center */
      body: string

      /** URL to open when the notification is tapped */
      ctaUrl: string
    }
  }
}

export const asNotifInfo = asObject<NotifInfo>({
  dateReceived: asMaybe(asDate, new Date(Date.now())),
  isBannerHidden: asOptional(asBoolean, false),
  isCompleted: asMaybe(asBoolean, false),
  isPriority: asMaybe(asBoolean, false),
  params: asMaybe(
    asObject({
      walletId: asMaybe(asString),
      promoCard: asMaybe(
        asObject({
          messageId: asString,
          title: asString,
          body: asString,
          ctaUrl: asString
        })
      )
    })
  )
})
const asNotifState = asObject(asNotifInfo)
export type NotifState = ReturnType<typeof asNotifState>

const asLocalAccountSettingsInner = asObject({
  contactsPermissionShown: asMaybe(asBoolean, false),
  developerModeOn: asMaybe(asBoolean, false),
  notifState: asMaybe(asNotifState, asNotifState({})),
  passwordReminder: asMaybe(asPasswordReminder, () => asPasswordReminder({})),
  isAccountBalanceVisible: asMaybe(asBoolean, true),
  spamFilterOn: asMaybe(asBoolean, true),
  spendingLimits: asMaybe(asSpendingLimits, () => asSpendingLimits({})),
  accountNotifDismissInfo: asMaybe(asAccountNotifDismissInfo, asAccountNotifDismissInfo({})),
  tokenWarningsShown: asMaybe(asTokenWarningsShown, [])
})

export const asDefaultScreen = asValue('home', 'assets')

const asDeviceSettingsInner = asObject({
  defaultScreen: asMaybe(asDefaultScreen, 'home'),
  developerPluginUri: asMaybe(asString),
  disableAnimations: asMaybe(asBoolean, false),
  forceLightAccountCreate: asMaybe(asBoolean, false),
  isSurveyDiscoverShown: asMaybe(asBoolean, false)
})

export const asLocalAccountSettings = asMaybe(asLocalAccountSettingsInner, () => asLocalAccountSettingsInner({}))
export const asDeviceSettings = asMaybe(asDeviceSettingsInner, () => asDeviceSettingsInner({}))

export type DefaultScreen = ReturnType<typeof asDefaultScreen>
export type PasswordReminder = ReturnType<typeof asPasswordReminder>
export type LocalAccountSettings = ReturnType<typeof asLocalAccountSettings>
export type DeviceSettings = ReturnType<typeof asDeviceSettings>
export type SpendingLimits = ReturnType<typeof asSpendingLimits>

export type SpendAuthType = 'pin' | 'none'

export interface GuiExchangeRates {
  [pair: string]: number
}
// Same as GuiExchangeRates but with better ergonomics. Limited to current and 24 hour rates.
export type GuiExchangeRatesMap = Map<string, Map<string, { currentRate: number; yesterdayRate: number }>>

export interface StateProvinceData {
  name: string
  'alpha-2': string
}

export interface CountryData {
  name: string
  'alpha-2': string
  'alpha-3': string
  filename?: string
  stateProvinces?: StateProvinceData[]
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

// https://developers.fioprotocol.io/pages/api/fio-api/#post-/get_sent_fio_requests
export type FioRequestStatus = 'rejected' | 'requested' | 'sent_to_blockchain'

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
  status: FioRequestStatus
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
  namespace: 'algorand' | 'cosmos' | 'eip155'
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
  defaultWallets: EdgeAsset[]
  forceCloseUrl: string
  ip2faSite: string
  knowledgeBase: string
  lightTheme: Theme
  otcEmail: string
  notificationServers: string[]
  phoneNumber: string
  playStore: string
  referralServers?: string[]
  supportsEdgeLogin: boolean
  supportEmail: string
  supportContactSite: string
  supportSite: string
  termsOfServiceSite: string
  website: string
  disableSwaps?: boolean
  disableSurveyModal?: boolean
  extraTab?: {
    webviewUrl: string
    tabType: 'edgeProvider' | 'webview'
    tabTitleKey: LocaleStringKey
    extraTabBarIconFont: string
    extraTabBarIconName: string
  }
}

/**
 * A wallet or token to show in the wallet list.
 *
 * We maintain a sorted wallet list in redux,
 * since it's quite expensive to calculate.
 */
export interface WalletListAssetItem {
  type: 'asset'
  key: string
  token?: EdgeToken
  tokenId: EdgeTokenId
  wallet: EdgeCurrencyWallet
}

/**
 * A wallet that hasn't booted yet, to show as a placeholder.
 */
export interface WalletListLoadingItem {
  type: 'loading'
  key: string
  walletId: string
}

export type WalletListItem = WalletListAssetItem | WalletListLoadingItem

export interface EdgeAsset {
  pluginId: string
  tokenId: EdgeTokenId
}

export interface TempActionDisplayInfo {
  title: string
  message: string
  complete: boolean
  steps?: TempActionDisplayInfo[]
}
