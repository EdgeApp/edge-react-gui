import * as NavigationCore from '@react-navigation/core'
import type { StackActionHelpers } from '@react-navigation/native'
import type { EdgeCurrencyWallet, EdgeTokenId } from 'edge-core-js'

import type { ChangeMiningFeeParams } from '../components/scenes/ChangeMiningFeeScene'
import type { CoinRankingDetailsParams } from '../components/scenes/CoinRankingDetailsScene'
import type { ConfirmSceneParams } from '../components/scenes/ConfirmScene'
import type { CreateWalletAccountSelectParams } from '../components/scenes/CreateWalletAccountSelectScene'
import type { CreateWalletAccountSetupParams } from '../components/scenes/CreateWalletAccountSetupScene'
import type { CreateWalletCompletionParams } from '../components/scenes/CreateWalletCompletionScene'
import type { CreateWalletImportOptionsParams } from '../components/scenes/CreateWalletImportOptionsScene'
import type { CreateWalletImportParams } from '../components/scenes/CreateWalletImportScene'
import type { CreateWalletSelectCryptoParams } from '../components/scenes/CreateWalletSelectCryptoScene'
import type { CreateWalletSelectFiatParams } from '../components/scenes/CreateWalletSelectFiatScene'
import type { ExchangeQuoteProcessingParams } from '../components/scenes/CryptoExchangeQuoteProcessingScene'
import type { CryptoExchangeQuoteParams } from '../components/scenes/CryptoExchangeQuoteScene'
import type { CurrencyNotificationParams } from '../components/scenes/CurrencyNotificationScene'
import type { CurrencySettingsParams } from '../components/scenes/CurrencySettingsScene'
import type { EdgeLoginParams } from '../components/scenes/EdgeLoginScene'
import type { EditTokenParams } from '../components/scenes/EditTokenScene'
import type { FioCreateHandleParams } from '../components/scenes/Fio/FioCreateHandleScene'
import type { GuiPluginListParams } from '../components/scenes/GuiPluginListScene'
import type { PluginViewParams } from '../components/scenes/GuiPluginViewScene'
import type { LoanCloseParams } from '../components/scenes/Loans/LoanCloseScene'
import type { LoanCreateConfirmationParams } from '../components/scenes/Loans/LoanCreateConfirmationScene'
import type { LoanCreateParams } from '../components/scenes/Loans/LoanCreateScene'
import type { LoanDetailsParams } from '../components/scenes/Loans/LoanDetailsScene'
import type { LoanManageParams } from '../components/scenes/Loans/LoanManageScene'
import type { LoanStatusParams } from '../components/scenes/Loans/LoanStatusScene'
import type { LoginParams } from '../components/scenes/LoginScene'
import type { ManageTokensParams } from '../components/scenes/ManageTokensScene'
import type { MigrateWalletCalculateFeeParams } from '../components/scenes/MigrateWalletCalculateFeeScene'
import type { MigrateWalletCompletionParams } from '../components/scenes/MigrateWalletCompletionScene'
import type { MigrateWalletSelectCryptoParams } from '../components/scenes/MigrateWalletSelectCryptoScene'
import type { OtpRepairParams } from '../components/scenes/OtpRepairScene'
import type { SendScene2Params } from '../components/scenes/SendScene2'
import type { StakeModifyParams } from '../components/scenes/Staking/StakeModifyScene'
import type { StakeOptionsParams } from '../components/scenes/Staking/StakeOptionsScene'
import type { StakeOverviewParams } from '../components/scenes/Staking/StakeOverviewScene'
import type { TransactionDetailsParams } from '../components/scenes/TransactionDetailsScene'
import type { TransactionListParams } from '../components/scenes/TransactionListScene'
import type { TransactionsExportParams } from '../components/scenes/TransactionsExportScene'
import type { WcConnectionsParams } from '../components/scenes/WcConnectionsScene'
import type { WcConnectParams } from '../components/scenes/WcConnectScene'
import type { WcDisconnectParams } from '../components/scenes/WcDisconnectScene'
import type { WebViewSceneParams } from '../components/scenes/WebViewScene'
import type { ExchangedFlipInputAmounts } from '../components/themed/ExchangedFlipInput2'
import type { FiatPluginAddressFormParams, FiatPluginSepaFormParams, FiatPluginSepaTransferParams } from '../plugins/gui/fiatPluginTypes'
import type { FiatPluginEnterAmountParams } from '../plugins/gui/scenes/FiatPluginEnterAmountScene'
import type { FiatPluginOpenWebViewParams } from '../plugins/gui/scenes/FiatPluginWebView'
import type { RewardsCardDashboardParams } from '../plugins/gui/scenes/RewardsCardDashboardScene'
import type { RewardsCardWelcomeParams } from '../plugins/gui/scenes/RewardsCardWelcomeScene'
import type { FioConnectionWalletItem, FioDomain, FioRequest } from './types'

/**
 * Defines the acceptable route parameters for each scene key.
 */
export interface RouteParamList {
  // Top-level router:
  login: LoginParams
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
  changeMiningFee2: ChangeMiningFeeParams
  changePassword: {}
  changePin: {}
  coinRanking: {}
  coinRankingDetails: CoinRankingDetailsParams
  confirmScene: ConfirmSceneParams
  createWalletAccountSelect: CreateWalletAccountSelectParams
  createWalletAccountSetup: CreateWalletAccountSetupParams
  createWalletCompletion: CreateWalletCompletionParams
  createWalletImport: CreateWalletImportParams
  createWalletImportOptions: CreateWalletImportOptionsParams
  createWalletSelectCrypto: CreateWalletSelectCryptoParams
  createWalletSelectCryptoNewAccount: CreateWalletSelectCryptoParams
  createWalletSelectFiat: CreateWalletSelectFiatParams
  currencyNotificationSettings: CurrencyNotificationParams
  currencySettings: CurrencySettingsParams
  defaultFiatSetting: {}
  edgeLogin: EdgeLoginParams
  editToken: EditTokenParams
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
  loanDetails: LoanDetailsParams
  loanCreate: LoanCreateParams
  loanCreateConfirmation: LoanCreateConfirmationParams
  loanClose: LoanCloseParams
  loanManage: LoanManageParams
  loanStatus: LoanStatusParams
  manageTokens: ManageTokensParams
  migrateWalletCompletion: MigrateWalletCompletionParams
  migrateWalletCalculateFee: MigrateWalletCalculateFeeParams
  migrateWalletSelectCrypto: MigrateWalletSelectCryptoParams
  notificationSettings: {}
  otpRepair: OtpRepairParams
  otpSetup: {}
  passwordRecovery: {}
  upgradeUsername: {}
  pluginListBuy: GuiPluginListParams
  pluginListSell: GuiPluginListParams
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
  stakeModify: StakeModifyParams
  stakeOptions: StakeOptionsParams
  stakeOverview: StakeOverviewParams
  testScene: {}
  transactionDetails: TransactionDetailsParams
  transactionList: TransactionListParams
  transactionsExport: TransactionsExportParams
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
