import type {
  EdgeMetadata,
  EdgeNetworkFee,
  EdgeReceiveAddress,
  EdgeTokenId,
  EdgeTransaction
} from 'edge-core-js'

import type { asExtendedCurrencyCode } from './edgeProviderCleaners'

export type ExtendedCurrencyCode = ReturnType<typeof asExtendedCurrencyCode>

export interface Caip19AssetResult {
  pluginId: string
  tokenId: EdgeTokenId
  caip19: string
}

export interface WalletDetails {
  name: string
  pluginId?: string
  receiveAddress: {
    publicAddress: string
  }
  chainCode: string
  currencyCode: string
  fiatCurrencyCode: string
  currencyIcon: string
  currencyIconDark: string
}

export interface EdgeGetReceiveAddressOptions {
  // Metadata to tag these addresses with for when funds arrive at the address
  metadata?: EdgeMetadata
}

export interface EdgeGetWalletHistoryResult {
  fiatCurrencyCode: string // the fiat currency code of all transactions in the wallet. I.e. "iso:USD"
  balance: string // the current balance of wallet in the native amount units. I.e. "satoshis"
  transactions: EdgeTransaction[]
}

export interface EdgeRequestSpendOptions {
  // Specify the currencyCode to spend to this URI. Required for spending tokens
  currencyCode?: string

  // This overrides any parameters specified in a URI such as label or message
  metadata?: EdgeMetadata
  networkFeeOption?: 'low' | 'standard' | 'high'

  // If true, do not allow the user to change the amount to spend
  lockInputs?: boolean

  // Do not broadcast transaction
  signOnly?: boolean

  // Additional identifier such as a payment ID for Monero or destination tag for Ripple/XRP
  // This overrides any parameters specified in a URI
  uniqueIdentifier?: string

  customNetworkFee?: EdgeNetworkFee
  orderId?: string
}

export interface EdgeProviderSpendTarget {
  exchangeAmount?: string
  nativeAmount?: string
  publicAddress?: string
  otherParams?: unknown
}

export interface EdgeProviderDeepLink {
  deepPath?: string
  deepQuery?: Record<string, string | null>
  promoCode?: string
}

export interface EdgeProviderMethods {
  getDeepLink: () => Promise<EdgeProviderDeepLink>

  // ---- Wallet methods ----------------

  chooseCurrencyWallet: (
    allowedCurrencyCodes?: ExtendedCurrencyCode[]
  ) => Promise<ExtendedCurrencyCode>
  /**
   * Select a wallet by CAIP-19 asset identifier.
   * This is a more precise alternative to `chooseCurrencyWallet` that uses
   * the CAIP-19 standard for unambiguous asset identification.
   *
   * @param caip19 - A CAIP-19 asset identifier string
   * @returns Object containing pluginId, tokenId, and caip19 of the selected asset
   */
  chooseCaip19Asset: (caip19: string) => Promise<Caip19AssetResult>
  getReceiveAddress: (
    options?: EdgeGetReceiveAddressOptions
  ) => Promise<EdgeReceiveAddress>
  getCurrentWalletInfo: () => Promise<WalletDetails>
  getWalletHistory: () => Promise<EdgeGetWalletHistoryResult>
  requestSpend: (
    providerSpendTargets: EdgeProviderSpendTarget[],
    options?: EdgeRequestSpendOptions
  ) => Promise<EdgeTransaction | undefined>
  requestSpendUri: (
    uri: string,
    options?: EdgeRequestSpendOptions
  ) => Promise<EdgeTransaction | undefined>
  signMessage: (message: string) => Promise<string>

  // ---- Storage methods ----------------

  /**
   * Write data to user's account.
   * This data is encrypted and synced between devices.
   *
   * Each "key" becomes a separate file on disk!
   * Try to use as few keys as possible, but prefer storing JSON.
   * Writing `undefined` will delete the file.
   */
  writeData: (data: Record<string, string | undefined>) => Promise<void>

  /**
   * Read data back from the user's account.
   * This can only access data written by this same plugin.
   *
   * The 'keys' is an array of files written by `writeData`.
   * Returns the contents of the files that exist,
   * and `undefined` for files that don't exist.
   */
  readData: (keys: string[]) => Promise<Record<string, string | undefined>>

  // ---- Display methods ----------------

  consoleLog: (message: string) => Promise<void>
  displayError: (error: Error | string) => Promise<void>
  displayToast: (message: string) => Promise<void>
  hasSafariView: () => Promise<boolean>
  openEmailApp: (emailAddress: string) => Promise<void>
  openSafariView: (url: string) => Promise<void>
  openURL: (url: string) => Promise<void>

  // ---- Navigation methods ----------------

  exitPlugin: () => Promise<void>
  restartPlugin: () => Promise<void>
}

export interface EdgeProvider
  extends EdgeProviderMethods,
    EdgeProviderDeepLink {}
