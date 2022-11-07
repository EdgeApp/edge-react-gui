import { EdgeCurrencyInfo, EdgeCurrencyWallet, EdgeSpendInfo, EdgeTransaction, JsonObject, OtpError } from 'edge-core-js'
import * as React from 'react'
import * as Flux from 'react-native-router-flux'

import { LoanManageActionOpType } from '../components/scenes/Loans/LoanManageScene'
import { ExchangedFlipInputAmounts } from '../components/themed/ExchangedFlipInput'
import { WalletCreateItem } from '../components/themed/WalletList'
import { PaymentMethod } from '../controllers/action-queue/WyreClient'
import { BorrowEngine, BorrowPlugin } from '../plugins/borrow-plugins/types'
import { FiatPluginEnterAmountResponse, FiatPluginGetMethodsResponse } from '../plugins/gui/fiatPluginTypes'
import { ChangeQuoteRequest, StakePolicy, StakePosition } from '../plugins/stake-plugins'
import { GuiPlugin } from './GuiPluginTypes'
import {
  CreateWalletType,
  FeeOption,
  FioConnectionWalletItem,
  FioDomain,
  FioRequest,
  GuiFiatType,
  GuiMakeSpendInfo,
  GuiSwapInfo,
  WcConnectionInfo
} from './types'
import { UriQueryMap } from './WebTypes'

type PluginViewParams = {
  // The GUI plugin we are showing the user:
  plugin: GuiPlugin

  // Set these to add stuff to the plugin URI:
  deepPath?: string
  deepQuery?: UriQueryMap
}
/**
 * Defines the acceptable route parameters for each scene key.
 */
export type ParamList = {
  // Top-level router:
  root: {}
  login: {}
  edge: {}

  // Logged-in scenes:
  changeMiningFee: {
    guiMakeSpendInfo: GuiMakeSpendInfo
    maxSpendSet: boolean
    onSubmit: (networkFeeOption: FeeOption, customNetworkFee: JsonObject) => void
    wallet: EdgeCurrencyWallet
  }
  changePassword: {}
  changePin: {}
  controlPanel: {}
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
  createWalletSelectCrypto: {}
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
  edgeLogin: {}
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
  exchangeScene: {}
  exchangeSettings: {}
  exchangeSuccess: {}
  extraTab: undefined
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
    actionOpType: LoanManageActionOpType
    loanAccountId: string
  }
  loanStatus: {
    actionQueueId: string
    loanAccountId?: string
  }
  manageTokens: {
    walletId: string
  }
  notificationSettings: {}
  otpRepair: {
    otpError: OtpError
  }
  otpSetup: {}
  passwordRecovery: {}
  pluginListBuy: { direction: 'buy' }
  pluginListSell: { direction: 'sell' }
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
  send2: {
    walletId: string
    tokenId?: string
    allowedCurrencyCodes?: string[]
    spendInfo?: EdgeSpendInfo
    openCamera?: boolean
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
    dismissAlert?: boolean
    fioAddress?: string
    fioPendingRequest?: FioRequest
    isSendUsingFioAddress?: boolean
    onBack?: () => void
    onDone?: (error: Error | null, edgeTransaction?: EdgeTransaction) => void
    beforeTransaction?: () => Promise<void>
    alternateBroadcast?: (edgeTransaction: EdgeTransaction) => Promise<EdgeTransaction>
  }
  settingsOverview: {}
  settingsOverviewTab: {}
  spendingLimits: {}
  stakeModify: {
    walletId: string
    stakePolicy: StakePolicy
    stakePosition: StakePosition
    modification: ChangeQuoteRequest['action']
  }
  stakeClaim: { stakePolicy: StakePolicy; walletId: string }
  stakeOptions: { currencyCode: string; stakePolicies: StakePolicy[]; walletId: string }
  stakeOverview: { stakePolicy: StakePolicy; walletId: string }
  termsOfService: {}
  testScene: {}
  transactionDetails: {
    edgeTransaction: EdgeTransaction
    amountFiat?: number
    thumbnailPath?: string
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
  walletListScene: {}
  wcConnections: {}
  wcDisconnect: { wcConnectionInfo: WcConnectionInfo }
  wcConnect: {
    uri: string
  }
}

/**
 * The global `Actions` object for navigation.
 */
export const Actions = {
  get currentParams(): any {
    return Flux.Actions.currentParams
  },
  get currentScene(): keyof ParamList {
    return Flux.Actions.currentScene
  },

  drawerClose() {
    Flux.Actions.drawerClose()
  },
  drawerOpen() {
    Flux.Actions.drawerOpen()
  },

  jump<Name extends keyof ParamList>(name: Name, params: ParamList[Name]): void {
    Flux.Actions.jump(name, { route: { name, params } })
  },
  push<Name extends keyof ParamList>(name: Name, params: ParamList[Name]): void {
    Flux.Actions.push(name, { route: { name, params } })
  },
  replace<Name extends keyof ParamList>(name: Name, params: ParamList[Name]): void {
    Flux.Actions.replace(name, { route: { name, params } })
  },

  refresh(params: any): void {
    Flux.Actions.refresh({ route: { name: Flux.Actions.currentScene, params } })
  },

  pop(): void {
    Flux.Actions.pop()
  },
  popTo(name: keyof ParamList): void {
    Flux.Actions.popTo(name)
  }
}

type NavigationEvent = 'didBlur' | 'didFocus' | 'willBlur' | 'willFocus'

/**
 * The of the `navigation` prop passed to each scene.
 */
export type NavigationProp<Name extends keyof ParamList> = {
  // Whether this scene is in the foreground:
  addListener: (event: NavigationEvent, callback: () => void) => () => void
  isFocused: () => boolean

  // Going places:
  navigate: <Name extends keyof ParamList>(name: Name, params: ParamList[Name]) => void
  push: <Name extends keyof ParamList>(name: Name, params: ParamList[Name]) => void
  replace: <Name extends keyof ParamList>(name: Name, params: ParamList[Name]) => void
  setParams: (params: ParamList[Name]) => void

  // Returning:
  goBack: () => void
  pop: () => void
  popToTop: () => void

  // Drawer:
  closeDrawer: () => void
  openDrawer: () => void
  toggleDrawer: () => void

  // Internals nobody should need to touch:
  state: unknown
}

/**
 * The of the `route` prop passed to each scene.
 */
export type RouteProp<Name extends keyof ParamList> = {
  name: Name
  params: ParamList[Name]
}

/**
 * Adjusts the navigation prop to match the definitions above.
 */
export function withNavigation<Props>(Component: React.ComponentType<Props>): React.FunctionComponent<Props> {
  function WithNavigation(props: any) {
    const navigation: NavigationProp<'edge'> = {
      addListener(event, callback) {
        const remover = props.navigation.addListener(event, callback)
        return () => remover.remove()
      },
      isFocused() {
        return props.navigation.isFocused()
      },

      navigate(name, params) {
        props.navigation.navigate(name, { route: { name, params } })
      },
      push(name, params) {
        props.navigation.push(name, { route: { name, params } })
      },
      replace(...a) {
        // prev, next, params) {
        props.navigation.replace(...a) // prev, next, next, { route: { params } })
      },
      setParams(params) {
        props.navigation.setParams({ route: { name: Actions.currentScene, params } })
      },

      goBack() {
        props.navigation.goBack()
      },
      pop() {
        props.navigation.pop()
      },
      popToTop() {
        props.navigation.popToTop()
      },

      closeDrawer() {
        props.navigation.closeDrawer()
      },
      openDrawer() {
        props.navigation.openDrawer()
      },
      toggleDrawer() {
        props.navigation.toggleDrawer()
      },

      get state() {
        return props.navigation.state
      }
    }

    return <Component {...props} navigation={navigation} />
  }
  const displayName = Component.displayName ?? Component.name ?? 'Component'
  WithNavigation.displayName = `WithNavigation(${displayName})`
  return WithNavigation
}
