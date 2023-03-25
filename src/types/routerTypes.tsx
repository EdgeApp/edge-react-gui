import * as NavigationCore from '@react-navigation/core'
import { ParamListBase, StackActionHelpers } from '@react-navigation/native'
import { EdgeCurrencyInfo, EdgeCurrencyWallet, EdgeSpendInfo, EdgeTransaction, JsonObject, OtpError } from 'edge-core-js'
import { InitialRouteName } from 'edge-login-ui-rn'

import { ConfirmSceneParams } from '../components/scenes/ConfirmScene'
import { FioCreateHandleProps } from '../components/scenes/Fio/FioCreateHandleScene'
import { PluginListProps } from '../components/scenes/GuiPluginListScene'
import { LoanManageType } from '../components/scenes/Loans/LoanManageScene'
import { MigrateWalletItem } from '../components/scenes/MigrateWalletSelectCryptoScene'
import { SendScene2Params } from '../components/scenes/SendScene2'
import { ExchangedFlipInputAmounts } from '../components/themed/ExchangedFlipInput'
import { WalletCreateItem } from '../components/themed/WalletList'
import { PaymentMethod } from '../controllers/action-queue/WyreClient'
import { BorrowEngine, BorrowPlugin } from '../plugins/borrow-plugins/types'
import { FiatPluginEnterAmountResponse, FiatPluginGetMethodsResponse } from '../plugins/gui/fiatPluginTypes'
import { ChangeQuoteRequest, StakePlugin, StakePolicy, StakePosition } from '../plugins/stake-plugins/types'
import { CoinRankingData } from './coinrankTypes'
import { GuiPlugin } from './GuiPluginTypes'
import {
  CreateWalletType,
  EdgeTokenId,
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
import { UriQueryMap } from './WebTypes'

interface PluginViewParams {
  // The GUI plugin we are showing the user:
  plugin: GuiPlugin

  // Set these to add stuff to the plugin URI:
  deepPath?: string
  deepQuery?: UriQueryMap
}
/**
 * Defines the acceptable route parameters for each scene key.
 */

interface RouteParamList {
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
  coinRankingDetails: {
    coinRankingData: CoinRankingData
  }
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
  createWalletCompletion: {
    createWalletList: WalletCreateItem[]
    walletNames: { [key: string]: string }
    fiatCode: string
    importText?: string
  }
  createWalletImport: {
    createWalletList: WalletCreateItem[]
    walletNames: { [key: string]: string }
    fiatCode: string
  }
  createWalletSelectCrypto: {
    newAccountFlow?: (navigation: NavigationProp<'createWalletSelectCrypto'>, items: WalletCreateItem[]) => Promise<void>
    defaultSelection?: EdgeTokenId[]
  }
  createWalletSelectFiat: {
    createWalletList: WalletCreateItem[]
  }
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
  }
  fioRequestList: {}
  fioRequestApproved: {
    edgeTransaction: EdgeTransaction
    thumbnailPath?: string
  }
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
  guiPluginEnterAmount: {
    headerTitle: string
    onSubmit: (response: FiatPluginEnterAmountResponse) => Promise<void>
    label1: string
    label2: string
    onChangeText: (fieldNum: number, value: string) => Promise<void>
    convertValue: (sourceFieldNum: number, value: string) => Promise<string | undefined>
    getMethods?: (methods: FiatPluginGetMethodsResponse) => void
    initialAmount1?: string
    headerIconUri?: string
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
  pluginListBuy: PluginListProps
  pluginListSell: PluginListProps
  pluginViewBuy: PluginViewParams
  pluginViewSell: PluginViewParams
  pluginView: PluginViewParams
  promotionSettings: {}
  request: {}
  scan: {
    data?: 'sweepPrivateKey' | 'loginQR'
  } // TODO
  securityAlerts: {}
  send: {
    allowedCurrencyCodes?: string[]
    guiMakeSpendInfo?: GuiMakeSpendInfo
    selectedWalletId?: string
    selectedCurrencyCode?: string
    isCameraOpen?: boolean
    lockTilesMap?: {
      address?: boolean
      wallet?: boolean
      amount?: boolean
    }
    hiddenTilesMap?: {
      address?: boolean
      amount?: boolean
      fioAddressSelect?: boolean
    }
    infoTiles?: Array<{ label: string; value: string }>
  }
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

export type AppParamList = {
  [key in keyof RouteParamList]: RouteParamList[key]
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
export interface SceneProps<RouteName extends keyof ParamList, ParamList extends ParamListBase = AppParamList> {
  route: NavigationCore.RouteProp<ParamList, RouteName>
  navigation: NavigationCore.NavigationProp<ParamList, RouteName> & StackActionHelpers<ParamList>
}
