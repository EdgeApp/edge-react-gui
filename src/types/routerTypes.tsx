import * as NavigationCore from '@react-navigation/core'
import type { StackActionHelpers } from '@react-navigation/native'
import type { EdgeCurrencyInfo, EdgeCurrencyWallet, EdgeSpendInfo, EdgeTokenId, JsonObject, OtpError } from 'edge-core-js'
import type { InitialRouteName } from 'edge-login-ui-rn'

import type { CoinRankingDetailsParams } from '../components/scenes/CoinRankingDetailsScene'
import type { ConfirmSceneParams } from '../components/scenes/ConfirmScene'
import type { CreateWalletCompletionParams } from '../components/scenes/CreateWalletCompletionScene'
import type { CreateWalletImportOptionsParams } from '../components/scenes/CreateWalletImportOptionsScene'
import type { CreateWalletImportParams } from '../components/scenes/CreateWalletImportScene'
import type { CreateWalletSelectCryptoParams } from '../components/scenes/CreateWalletSelectCryptoScene'
import type { CreateWalletSelectFiatParams } from '../components/scenes/CreateWalletSelectFiatScene'
import type { ExchangeQuoteProcessingParams } from '../components/scenes/CryptoExchangeQuoteProcessingScene'
import type { CryptoExchangeQuoteParams } from '../components/scenes/CryptoExchangeQuoteScene'
import type { FioCreateHandleParams } from '../components/scenes/Fio/FioCreateHandleScene'
import type { PluginViewParams } from '../components/scenes/GuiPluginViewScene'
import type { LoanManageType } from '../components/scenes/Loans/LoanManageScene'
import type { MigrateWalletItem } from '../components/scenes/MigrateWalletSelectCryptoScene'
import type { SendScene2Params } from '../components/scenes/SendScene2'
import type { StakeOptionsParams } from '../components/scenes/Staking/StakeOptionsScene'
import type { StakeOverviewParams } from '../components/scenes/Staking/StakeOverviewScene'
import type { TransactionDetailsParams } from '../components/scenes/TransactionDetailsScene'
import type { TransactionListParams } from '../components/scenes/TransactionListScene'
import type { WcConnectionsParams } from '../components/scenes/WcConnectionsScene'
import type { WcConnectParams } from '../components/scenes/WcConnectScene'
import type { WcDisconnectParams } from '../components/scenes/WcDisconnectScene'
import type { WebViewSceneParams } from '../components/scenes/WebViewScene'
import type { ExchangedFlipInputAmounts } from '../components/themed/ExchangedFlipInput2'
import type { PaymentMethod } from '../controllers/action-queue/PaymentMethod'
import type { BorrowEngine, BorrowPlugin } from '../plugins/borrow-plugins/types'
import type { FiatPluginAddressFormParams, FiatPluginSepaFormParams, FiatPluginSepaTransferParams } from '../plugins/gui/fiatPluginTypes'
import type { FiatPluginEnterAmountParams } from '../plugins/gui/scenes/FiatPluginEnterAmountScene'
import type { FiatPluginOpenWebViewParams } from '../plugins/gui/scenes/FiatPluginWebView'
import type { RewardsCardDashboardParams } from '../plugins/gui/scenes/RewardsCardDashboardScene'
import type { RewardsCardWelcomeParams } from '../plugins/gui/scenes/RewardsCardWelcomeScene'
import type { ChangeQuoteRequest, StakePlugin, StakePolicy, StakePosition } from '../plugins/stake-plugins/types'
import type { CreateWalletType, FeeOption, FioConnectionWalletItem, FioDomain, FioRequest } from './types'

/**
 * Defines the acceptable route parameters for each scene key.
 */
export interface RouteParamList {
  // Top-level router:
  login: {
    loginUiInitialRoute?: InitialRouteName
  }
  edgeApp: {}
  edgeAppStack: {}
  edgeTabs: {}
  gettingStarted: {}

  // Tabs
  homeTab: {}
  walletsTab: {}
  buyTab: {}
  sellTab: {}
  exchangeTab: {}
  extraTab: undefined
  devTab: undefined

  // Gui Plugins
  guiPluginEnterAmount: FiatPluginEnterAmountParams
  guiPluginAddressForm: FiatPluginAddressFormParams
  guiPluginInfoDisplay: FiatPluginSepaTransferParams
  guiPluginSepaForm: FiatPluginSepaFormParams
  guiPluginWebView: FiatPluginOpenWebViewParams
  rewardsCardDashboard: RewardsCardDashboardParams
  rewardsCardWelcome: RewardsCardWelcomeParams

  // Logged-in scenes:
  assetSettings: {}
  changeMiningFee2: {
    spendInfo: EdgeSpendInfo
    maxSpendSet: boolean
    onSubmit: (networkFeeOption: FeeOption, customNetworkFee: JsonObject) => void
    wallet: EdgeCurrencyWallet
  }
  changePassword: {}
  changePin: {}
  coinRanking: {}
  coinRankingDetails: CoinRankingDetailsParams
  confirmScene: ConfirmSceneParams
  createWalletAccountSelect: {
    accountName: string
    existingWalletId: string
    selectedWalletType: CreateWalletType
  }
  createWalletAccountSetup: {
    accountHandle?: string
    existingWalletId: string
    isReactivation?: boolean
    selectedWalletType: CreateWalletType
  }
  createWalletCompletion: CreateWalletCompletionParams
  createWalletImport: CreateWalletImportParams
  createWalletImportOptions: CreateWalletImportOptionsParams
  createWalletSelectCrypto: CreateWalletSelectCryptoParams
  createWalletSelectCryptoNewAccount: CreateWalletSelectCryptoParams
  createWalletSelectFiat: CreateWalletSelectFiatParams
  currencyNotificationSettings: {
    currencyInfo: EdgeCurrencyInfo
  }
  currencySettings: {
    currencyInfo: EdgeCurrencyInfo
  }
  defaultFiatSetting: {}
  edgeLogin: {
    lobbyId: string
  }
  editToken: {
    currencyCode?: string
    displayName?: string
    multiplier?: string
    networkLocation?: JsonObject
    tokenId?: EdgeTokenId // Acts like "add token" if this is missing
    walletId: string
  }
  exchange: {}
  exchangeQuote: CryptoExchangeQuoteParams
  exchangeQuoteProcessing: ExchangeQuoteProcessingParams
  exchangeSettings: {}
  exchangeSuccess: {}
  fioCreateHandle: FioCreateHandleParams
  fioAddressDetails: {
    fioAddressName: string
    bundledTxs: number
  }
  fioAddressList: {}
  fioAddressRegister: {}
  fioAddressRegisterSelectWallet: {
    fioAddress: string
    selectedWallet: EdgeCurrencyWallet
    selectedDomain: FioDomain
    isFallback?: boolean
  }
  fioAddressRegisterSuccess: {
    fioName: string
    expiration?: string
  }
  fioAddressSettings: {
    fioWallet: EdgeCurrencyWallet
    fioAddressName: string
    bundledTxs?: number
    showAddBundledTxs?: boolean
    refreshAfterAddBundledTxs?: boolean
  }
  fioConnectToWalletsConfirm: {
    fioWallet: EdgeCurrencyWallet
    fioAddressName: string
    walletsToConnect: FioConnectionWalletItem[]
    walletsToDisconnect: FioConnectionWalletItem[]
  }
  fioDomainConfirm: {
    fioName: string
    paymentWallet: EdgeCurrencyWallet
    fee: number
    ownerPublicKey: string
  }
  fioDomainRegister: {}
  fioDomainRegisterSelectWallet: {
    fioDomain: string
    selectedWallet: EdgeCurrencyWallet
  }
  fioDomainSettings: {
    fioWallet: EdgeCurrencyWallet
    fioDomainName: string
    isPublic: boolean
    expiration: string
    showRenew?: boolean
  }
  fioNameConfirm: {
    fioName: string
    paymentWallet: EdgeCurrencyWallet
    fee: number
    ownerPublicKey: string
  }
  fioRequestConfirmation: {
    amounts: ExchangedFlipInputAmounts
    fioAddressTo: string
  }
  fioRequestList: {}
  fioSentRequestDetails: {
    selectedFioSentRequest: FioRequest
  }
  fioStakingChange: {
    change: 'add' | 'remove'
    tokenId: EdgeTokenId
    walletId: string
  }
  fioStakingOverview: {
    tokenId: EdgeTokenId
    walletId: string
  }
  home: {}
  loanDashboard: {}
  loanDetails: {
    loanAccountId: string
  }
  loanCreate: {
    borrowEngine: BorrowEngine
    borrowPlugin: BorrowPlugin
  }
  loanCreateConfirmation: {
    borrowEngine: BorrowEngine
    borrowPlugin: BorrowPlugin
    destTokenId: EdgeTokenId
    destWallet: EdgeCurrencyWallet
    nativeDestAmount: string
    nativeSrcAmount: string
    paymentMethod?: PaymentMethod
    srcTokenId: EdgeTokenId
    srcWallet: EdgeCurrencyWallet
  }
  loanClose: {
    loanAccountId: string
  }
  loanManage: {
    loanManageType: LoanManageType
    loanAccountId: string
  }
  loanStatus: {
    actionQueueId: string
    loanAccountId: string
  }
  manageTokens: {
    walletId: string
  }
  migrateWalletCompletion: {
    migrateWalletList: MigrateWalletItem[]
  }
  migrateWalletCalculateFee: {
    migrateWalletList: MigrateWalletItem[]
  }
  migrateWalletSelectCrypto: {
    preSelectedWalletIds?: string[]
  }
  notificationSettings: {}
  otpRepair: {
    otpError: OtpError
  }
  otpSetup: {}
  passwordRecovery: {}
  upgradeUsername: {}
  pluginListBuy: {
    launchPluginId?: string
  }
  pluginListSell: {
    launchPluginId?: string
  }
  pluginViewBuy: PluginViewParams
  pluginViewSell: PluginViewParams
  pluginView: PluginViewParams
  promotionSettings: {}
  request: {}
  securityAlerts: {}
  send2: SendScene2Params
  settingsOverview: {}
  settingsOverviewTab: {}
  spendingLimits: {}
  stakeModify: {
    title: string
    stakePlugin: StakePlugin
    walletId: string
    stakePolicy: StakePolicy
    stakePosition: StakePosition
    modification: ChangeQuoteRequest['action']
  }
  stakeOptions: StakeOptionsParams
  stakeOverview: StakeOverviewParams
  testScene: {}
  transactionDetails: TransactionDetailsParams
  transactionList: TransactionListParams
  transactionsExport: {
    sourceWallet: EdgeCurrencyWallet
    currencyCode: string
  }
  walletList: {}
  webView: WebViewSceneParams
  wcConnections: WcConnectionsParams
  wcDisconnect: WcDisconnectParams
  wcConnect: WcConnectParams
}

export type RouteSceneKey = keyof RouteParamList

export type AppParamList = {
  [key in RouteSceneKey]: RouteParamList[key]
}

/**
 * The of the `navigation` prop passed to each scene,
 * but without any scene-specific stuff.
 */
export type NavigationBase = NavigationCore.NavigationProp<AppParamList> & StackActionHelpers<AppParamList>

/**
 * The `navigation` prop passed to each scene.
 */

export type NavigationProp<RouteName extends keyof AppParamList> = NavigationCore.NavigationProp<AppParamList, RouteName> & StackActionHelpers<AppParamList>

/**
 * The `route` prop passed to each scene.
 */
export type RouteProp<Name extends keyof AppParamList> = NavigationCore.RouteProp<AppParamList, Name>

/**
 * All the props passed to each scene.
 */
export interface EdgeSceneProps<Name extends keyof AppParamList> {
  navigation: NavigationProp<Name>
  route: RouteProp<Name>
}
