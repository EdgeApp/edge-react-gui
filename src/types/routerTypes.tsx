import { BottomTabScreenProps } from '@react-navigation/bottom-tabs'
import type { NavigatorScreenParams } from '@react-navigation/core'
import * as NavigationCore from '@react-navigation/core'
import { DrawerScreenProps } from '@react-navigation/drawer'
import type { CompositeScreenProps, StackActionHelpers } from '@react-navigation/native'
import type { StackScreenProps } from '@react-navigation/stack'

import type { ChangeMiningFeeParams } from '../components/scenes/ChangeMiningFeeScene'
import type { CoinRankingDetailsParams } from '../components/scenes/CoinRankingDetailsScene'
import type { ConfirmSceneParams } from '../components/scenes/ConfirmScene'
import type { CreateWalletAccountSelectParams } from '../components/scenes/CreateWalletAccountSelectScene'
import type { CreateWalletAccountSetupParams } from '../components/scenes/CreateWalletAccountSetupScene'
import type { CreateWalletCompletionParams } from '../components/scenes/CreateWalletCompletionScene'
import type { CreateWalletEditNameParams } from '../components/scenes/CreateWalletEditNameScene'
import type { CreateWalletImportOptionsParams } from '../components/scenes/CreateWalletImportOptionsScene'
import type { CreateWalletImportParams } from '../components/scenes/CreateWalletImportScene'
import type { CreateWalletSelectCryptoParams } from '../components/scenes/CreateWalletSelectCryptoScene'
import type { CurrencyNotificationParams } from '../components/scenes/CurrencyNotificationScene'
import type { CurrencySettingsParams } from '../components/scenes/CurrencySettingsScene'
import type { EdgeLoginParams } from '../components/scenes/EdgeLoginScene'
import type { EditTokenParams } from '../components/scenes/EditTokenScene'
import type { FioAddressDetailsParams } from '../components/scenes/Fio/FioAddressDetailsScene'
import type { FioAddressRegisterSuccessParams } from '../components/scenes/Fio/FioAddressRegisteredScene'
import type { FioAddressRegisterSelectWalletParams } from '../components/scenes/Fio/FioAddressRegisterSelectWalletScene'
import type { FioAddressSettingsParams } from '../components/scenes/Fio/FioAddressSettingsScene'
import type { FioConnectWalletConfirmParams } from '../components/scenes/Fio/FioConnectWalletConfirmScene'
import type { FioCreateHandleParams } from '../components/scenes/Fio/FioCreateHandleScene'
import type { FioDomainRegisterSelectWalletParams } from '../components/scenes/Fio/FioDomainRegisterSelectWalletScene'
import type { FioDomainSettingsParams } from '../components/scenes/Fio/FioDomainSettingsScene'
import type { FioNameConfirmParams } from '../components/scenes/Fio/FioNameConfirmScene'
import type { FioRequestConfirmationParams } from '../components/scenes/Fio/FioRequestConfirmationScene'
import type { FioSentRequestDetailsParams } from '../components/scenes/Fio/FioSentRequestDetailsScene'
import type { FioStakingChangeParams } from '../components/scenes/Fio/FioStakingChangeScene'
import type { FioStakingOverviewParams } from '../components/scenes/Fio/FioStakingOverviewScene'
import type { GettingStartedParams } from '../components/scenes/GettingStartedScene'
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
import type { RequestParams } from '../components/scenes/RequestScene'
import type { SendScene2Params } from '../components/scenes/SendScene2'
import type { EarnSceneParams } from '../components/scenes/Staking/EarnScene'
import type { StakeModifyParams } from '../components/scenes/Staking/StakeModifyScene'
import type { StakeOptionsParams } from '../components/scenes/Staking/StakeOptionsScene'
import type { StakeOverviewParams } from '../components/scenes/Staking/StakeOverviewScene'
import type { SwapConfirmationParams } from '../components/scenes/SwapConfirmationScene'
import type { SwapCreateParams } from '../components/scenes/SwapCreateScene'
import type { SwapProcessingParams } from '../components/scenes/SwapProcessingScene'
import { SwapSuccessParams } from '../components/scenes/SwapSuccessScene'
import type { SweepPrivateKeyCalculateFeeParams } from '../components/scenes/SweepPrivateKeyCalculateFeeScene'
import type { SweepPrivateKeyCompletionParams } from '../components/scenes/SweepPrivateKeyCompletionScene'
import type { SweepPrivateKeyProcessingParams } from '../components/scenes/SweepPrivateKeyProcessingScene'
import type { SweepPrivateKeySelectCryptoParams } from '../components/scenes/SweepPrivateKeySelectCryptoScene'
import type { TransactionDetailsParams } from '../components/scenes/TransactionDetailsScene'
import type { TransactionListParams } from '../components/scenes/TransactionListScene'
import type { TransactionsExportParams } from '../components/scenes/TransactionsExportScene'
import type { WcConnectionsParams } from '../components/scenes/WcConnectionsScene'
import type { WcConnectParams } from '../components/scenes/WcConnectScene'
import type { WcDisconnectParams } from '../components/scenes/WcDisconnectScene'
import type { WebViewSceneParams } from '../components/scenes/WebViewScene'
import type { FiatPluginAddressFormParams } from '../plugins/gui/scenes/AddressFormScene'
import type { FiatPluginEnterAmountParams } from '../plugins/gui/scenes/FiatPluginEnterAmountScene'
import type { FiatPluginOpenWebViewParams } from '../plugins/gui/scenes/FiatPluginWebView'
import type { FiatPluginSepaTransferParams } from '../plugins/gui/scenes/InfoDisplayScene'
import type { RewardsCardDashboardParams } from '../plugins/gui/scenes/RewardsCardDashboardScene'
import type { RewardsCardWelcomeParams } from '../plugins/gui/scenes/RewardsCardWelcomeScene'
import type { FiatPluginSepaFormParams } from '../plugins/gui/scenes/SepaFormScene'

// -------------------------------------------------------------------------
// Router types
//
// These must all be `type`, not `interface`, because of
// https://reactnavigation.org/docs/typescript#type-checking-the-navigator
// -------------------------------------------------------------------------

export type WalletsTabParamList = {} & {
  walletList: undefined
  transactionList: TransactionListParams
  transactionDetails: TransactionDetailsParams
}

// TODO: Split this up into distinct param lists?
export type BuyTabParamList = {} & {
  pluginListBuy: GuiPluginListParams | undefined
  pluginListSell: GuiPluginListParams | undefined
  pluginViewBuy: PluginViewParams
  pluginViewSell: PluginViewParams
  guiPluginAddressForm: FiatPluginAddressFormParams
  guiPluginEnterAmount: FiatPluginEnterAmountParams
  guiPluginInfoDisplay: FiatPluginSepaTransferParams
  guiPluginSepaForm: FiatPluginSepaFormParams
  guiPluginWebView: FiatPluginOpenWebViewParams
  rewardsCardDashboard: RewardsCardDashboardParams
  rewardsCardWelcome: RewardsCardWelcomeParams
}

export type SellTabParamList = {} & BuyTabParamList

export type SwapTabParamList = {} & {
  swapCreate: SwapCreateParams | undefined
  swapConfirmation: SwapConfirmationParams
  swapProcessing: SwapProcessingParams
}

export type EdgeTabsParamList = {} & {
  home: undefined
  walletsTab: NavigatorScreenParams<WalletsTabParamList> | undefined
  buyTab: NavigatorScreenParams<BuyTabParamList> | undefined
  sellTab: NavigatorScreenParams<SellTabParamList> | undefined
  swapTab: NavigatorScreenParams<SwapTabParamList> | undefined
  extraTab: undefined
  devTab: undefined
}

export type EdgeAppStackParamList = {} & {
  // We nest the tabs inside this master stack:
  edgeTabs: NavigatorScreenParams<EdgeTabsParamList>

  assetSettings: undefined
  changeMiningFee2: ChangeMiningFeeParams
  changePassword: undefined
  changePin: undefined
  coinRanking: undefined
  coinRankingDetails: CoinRankingDetailsParams
  confirmScene: ConfirmSceneParams
  createWalletAccountSelect: CreateWalletAccountSelectParams
  createWalletAccountSetup: CreateWalletAccountSetupParams
  createWalletCompletion: CreateWalletCompletionParams
  createWalletEditName: CreateWalletEditNameParams
  createWalletImport: CreateWalletImportParams
  createWalletImportOptions: CreateWalletImportOptionsParams
  createWalletSelectCrypto: CreateWalletSelectCryptoParams
  createWalletSelectCryptoNewAccount: CreateWalletSelectCryptoParams
  currencyNotificationSettings: CurrencyNotificationParams
  currencySettings: CurrencySettingsParams
  defaultFiatSetting: undefined
  earnScene: EarnSceneParams
  edgeLogin: EdgeLoginParams
  editToken: EditTokenParams
  extraTab: undefined
  fioAddressDetails: FioAddressDetailsParams
  fioAddressList: undefined
  fioAddressRegister: undefined
  fioAddressRegisterSelectWallet: FioAddressRegisterSelectWalletParams
  fioAddressRegisterSuccess: FioAddressRegisterSuccessParams
  fioAddressSettings: FioAddressSettingsParams
  fioConnectToWalletsConfirm: FioConnectWalletConfirmParams
  fioCreateHandle: FioCreateHandleParams
  fioDomainConfirm: FioNameConfirmParams
  fioDomainRegister: undefined
  fioDomainRegisterSelectWallet: FioDomainRegisterSelectWalletParams
  fioDomainSettings: FioDomainSettingsParams
  fioNameConfirm: FioNameConfirmParams
  fioRequestConfirmation: FioRequestConfirmationParams
  fioRequestList: undefined
  fioSentRequestDetails: FioSentRequestDetailsParams
  fioStakingChange: FioStakingChangeParams
  fioStakingOverview: FioStakingOverviewParams
  loanClose: LoanCloseParams
  loanCreate: LoanCreateParams
  loanCreateConfirmation: LoanCreateConfirmationParams
  loanDashboard: undefined
  loanDetails: LoanDetailsParams
  loanManage: LoanManageParams
  loanStatus: LoanStatusParams
  manageTokens: ManageTokensParams
  migrateWalletCalculateFee: MigrateWalletCalculateFeeParams
  migrateWalletCompletion: MigrateWalletCompletionParams
  migrateWalletSelectCrypto: MigrateWalletSelectCryptoParams
  notificationSettings: undefined
  otpRepair: OtpRepairParams
  otpSetup: undefined
  passwordRecovery: undefined
  pluginView: PluginViewParams
  promotionSettings: undefined
  request: RequestParams
  securityAlerts: undefined
  send2: SendScene2Params
  settingsOverview: undefined
  settingsOverviewTab: undefined
  spendingLimits: undefined
  stakeModify: StakeModifyParams
  stakeOptions: StakeOptionsParams
  stakeOverview: StakeOverviewParams
  swapSettings: undefined
  swapSuccess: SwapSuccessParams
  sweepPrivateKeyCalculateFee: SweepPrivateKeyCalculateFeeParams
  sweepPrivateKeyCompletion: SweepPrivateKeyCompletionParams
  sweepPrivateKeyProcessing: SweepPrivateKeyProcessingParams
  sweepPrivateKeySelectCrypto: SweepPrivateKeySelectCryptoParams
  testScene: undefined
  transactionDetails: TransactionDetailsParams
  transactionsExport: TransactionsExportParams
  upgradeUsername: undefined
  walletRestore: undefined
  wcConnect: WcConnectParams
  wcConnections: WcConnectionsParams
  wcDisconnect: WcDisconnectParams
  webView: WebViewSceneParams
}

// A drawer router that contains the main `edgeAppStack`
export type DrawerParamList = {} & {
  edgeAppStack: NavigatorScreenParams<EdgeAppStackParamList> | undefined
}

export type RootParamList = {} & {
  edgeApp: NavigatorScreenParams<DrawerParamList> | undefined
  gettingStarted: GettingStartedParams
  login: LoginParams
}

// Upgraded types to comply with the navigation upgrade requirements
export type RootSceneProps<Name extends keyof RootParamList> = StackScreenProps<RootParamList, Name>

export type DrawerSceneProps<Name extends keyof DrawerParamList> = CompositeScreenProps<
  DrawerScreenProps<DrawerParamList, Name>,
  RootSceneProps<keyof RootParamList>
>

export type EdgeAppSceneProps<Name extends keyof EdgeAppStackParamList> = CompositeScreenProps<
  StackScreenProps<EdgeAppStackParamList, Name>,
  DrawerSceneProps<keyof DrawerParamList>
>

export type EdgeTabsSceneProps<Name extends keyof EdgeTabsParamList> = CompositeScreenProps<
  BottomTabScreenProps<EdgeTabsParamList, Name>,
  EdgeAppSceneProps<keyof EdgeAppStackParamList>
>
export type BuyTabSceneProps<Name extends keyof BuyTabParamList> = CompositeScreenProps<
  StackScreenProps<BuyTabParamList, Name>,
  EdgeTabsSceneProps<keyof EdgeTabsParamList>
>
export type SellTabSceneProps<Name extends keyof SellTabParamList> = CompositeScreenProps<
  StackScreenProps<SellTabParamList, Name>,
  EdgeTabsSceneProps<keyof EdgeTabsParamList>
>
export type SwapTabSceneProps<Name extends keyof SwapTabParamList> = CompositeScreenProps<
  StackScreenProps<SwapTabParamList, Name>,
  EdgeTabsSceneProps<keyof EdgeTabsParamList>
>
export type WalletsTabSceneProps<Name extends keyof WalletsTabParamList> = CompositeScreenProps<
  StackScreenProps<WalletsTabParamList, Name>,
  EdgeTabsSceneProps<keyof EdgeTabsParamList>
>

// -------------------------------------------------------------------------
// Legacy types
//
// These are a giant hack to smooth away the differences
// between different navigation objects.
// They pretend that any navigator to visit any scene,
// as if the whole app were flat. That's not how react-navigation works,
// but it's "close enough" until we can utilize the proper types
// defined above.
// -------------------------------------------------------------------------

export type AppParamList = RootParamList &
  DrawerParamList &
  EdgeAppStackParamList &
  EdgeTabsParamList &
  SwapTabParamList &
  BuyTabParamList &
  WalletsTabParamList

export type RouteSceneKey = keyof AppParamList

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
