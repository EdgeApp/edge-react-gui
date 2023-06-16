import * as NavigationCore from '@react-navigation/core'
import { StackActionHelpers } from '@react-navigation/native'
import { EdgeCurrencyInfo, EdgeCurrencyWallet, EdgeSpendInfo, EdgeTransaction, JsonObject, OtpError } from 'edge-core-js'
import { InitialRouteName } from 'edge-login-ui-rn'

import { CoinRankingDetailsParams } from '../components/scenes/CoinRankingDetailsScene'
import { ConfirmSceneParams } from '../components/scenes/ConfirmScene'
import { CreateWalletCompletionParams } from '../components/scenes/CreateWalletCompletionScene'
import { CreateWalletImportOptionsParams } from '../components/scenes/CreateWalletImportOptionsScene'
import { CreateWalletImportParams } from '../components/scenes/CreateWalletImportScene'
import { CreateWalletSelectCryptoParams } from '../components/scenes/CreateWalletSelectCryptoScene'
import { CreateWalletSelectFiatParams } from '../components/scenes/CreateWalletSelectFiatScene'
import { FioCreateHandleProps } from '../components/scenes/Fio/FioCreateHandleScene'
import { PluginViewParams } from '../components/scenes/GuiPluginViewScene'
import { LoanManageType } from '../components/scenes/Loans/LoanManageScene'
import { MigrateWalletItem } from '../components/scenes/MigrateWalletSelectCryptoScene'
import { SendSceneParams } from '../components/scenes/SendScene'
import { SendScene2Params } from '../components/scenes/SendScene2'
import { ExchangedFlipInputAmounts } from '../components/themed/ExchangedFlipInput'
import { PaymentMethod } from '../controllers/action-queue/WyreClient'
import { BorrowEngine, BorrowPlugin } from '../plugins/borrow-plugins/types'
import { FiatPluginAddressFormParams, FiatPluginSepaFormParams, FiatPluginSepaTransferParams } from '../plugins/gui/fiatPluginTypes'
import { FiatPluginEnterAmountParams } from '../plugins/gui/scenes/FiatPluginEnterAmountScene'
import { RewardsCardDashboardParams } from '../plugins/gui/scenes/RewardsCardDashboardScene'
import { RewardsCardWelcomeParams } from '../plugins/gui/scenes/RewardsCardWelcomeScene'
import { ChangeQuoteRequest, StakePlugin, StakePolicy, StakePosition } from '../plugins/stake-plugins/types'
import {
  CreateWalletType,
  FeeOption,
  FioConnectionWalletItem,
  FioDomain,
  FioRequest,
  GuiFiatType,
  GuiMakeSpendInfo,
  GuiSwapInfo,
  TransactionListTx,
  WcConnectionInfo
} from './types'

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
  controlPanel: {}
  gettingStarted: {}

  // Tabs
  walletsTab: {}
  buyTab: {}
  sellTab: {}
  exchangeTab: {}
  marketsTab: {}

  // Gui Plugins
  guiPluginEnterAmount: FiatPluginEnterAmountParams
  guiPluginAddressForm: FiatPluginAddressFormParams
  guiPluginInfoDisplay: FiatPluginSepaTransferParams
  guiPluginSepaForm: FiatPluginSepaFormParams
  rewardsCardDashboard: RewardsCardDashboardParams
  rewardsCardWelcome: RewardsCardWelcomeParams

  // Logged-in scenes:
  changeMiningFee: {
    guiMakeSpendInfo: GuiMakeSpendInfo
    maxSpendSet: boolean
    onSubmit: (networkFeeOption: FeeOption, customNetworkFee: JsonObject) => void
    wallet: EdgeCurrencyWallet
  }
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
    existingWalletId?: string
    selectedFiat: GuiFiatType
    selectedWalletType: CreateWalletType
  }
  createWalletAccountSetup: {
    accountHandle?: string
    existingWalletId?: string
    isReactivation?: boolean
    selectedFiat: GuiFiatType
    selectedWalletType: CreateWalletType
  }
  createWalletCompletion: CreateWalletCompletionParams
  createWalletImport: CreateWalletImportParams
  createWalletImportOptions: CreateWalletImportOptionsParams
  createWalletSelectCrypto: CreateWalletSelectCryptoParams
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
    tokenId?: string // Acts like "add token" if this is missing
    walletId: string
  }
  exchange: {}
  exchangeQuote: {
    swapInfo: GuiSwapInfo
    onApprove: () => void
  }
  exchangeQuoteProcessing: {}
  exchangeSettings: {}
  exchangeSuccess: {}
  extraTab: undefined
  fioCreateHandle: FioCreateHandleProps
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
    currencyCode: string
    walletId: string
  }
  fioStakingOverview: {
    currencyCode: string
    walletId: string
  }
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
    destTokenId: string
    destWallet: EdgeCurrencyWallet
    nativeDestAmount: string
    nativeSrcAmount: string
    paymentMethod?: PaymentMethod
    srcTokenId?: string
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
  scan: {
    data?: 'sweepPrivateKey' | 'loginQR'
  } // TODO
  securityAlerts: {}
  send: SendSceneParams
  send2: SendScene2Params
  settingsOverview: {}
  settingsOverviewTab: {}
  spendingLimits: {}
  stakeModify: {
    stakePlugin: StakePlugin
    walletId: string
    stakePolicy: StakePolicy
    stakePosition: StakePosition
    modification: ChangeQuoteRequest['action']
  }
  stakeOptions: { stakePlugins: StakePlugin[]; currencyCode: string; stakePolicies: StakePolicy[]; walletId: string }
  stakeOverview: { stakePlugin: StakePlugin; stakePolicy: StakePolicy; walletId: string }
  termsOfService: {}
  testScene: {}
  transactionDetails: {
    edgeTransaction: EdgeTransaction | TransactionListTx
    walletId: string
  }
  transactionList: {
    walletId: string
    currencyCode: string
  }
  transactionsExport: {
    sourceWallet: EdgeCurrencyWallet
    currencyCode: string
  }
  walletList: {}
  wcConnections: {}
  wcDisconnect: { wcConnectionInfo: WcConnectionInfo }
  wcConnect: {
    uri: string
  }
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
