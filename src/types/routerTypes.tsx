

import { EdgeCurrencyInfo, EdgeCurrencyWallet, EdgeTransaction, JsonObject, OtpError } from 'edge-core-js'
import * as React from 'react'
import * as Flux from 'react-native-router-flux'

import { ExchangedFlipInputAmounts } from '../components/themed/ExchangedFlipInput'
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
  plugin: GuiPlugin,

  // Set these to add stuff to the plugin URI:
  deepPath?: string,
  deepQuery?: UriQueryMap
}
/**
 * Defines the acceptable route parameters for each scene key.
 */
export type ParamList = {
  // Top-level router:
  root: void,
  login: void,
  edge: void,

  // Logged-in scenes:
  changeMiningFee: {
    guiMakeSpendInfo: GuiMakeSpendInfo,
    maxSpendSet: boolean,
    onSubmit: (networkFeeOption: FeeOption, customNetworkFee: JsonObject) => void,
    wallet: EdgeCurrencyWallet
  },
  changePassword: void,
  changePin: void,
  controlPanel: void,
  createWalletAccountSelect: {
    accountName: string,
    existingWalletId?: string,
    selectedFiat: GuiFiatType,
    selectedWalletType: CreateWalletType
  },
  createWalletAccountSetup: {
    accountHandle?: string,
    existingWalletId?: string,
    isReactivation?: boolean,
    selectedFiat: GuiFiatType,
    selectedWalletType: CreateWalletType
  },
  createWalletChoice: {
    selectedWalletType: CreateWalletType
  },
  createWalletImport: {
    selectedWalletType: CreateWalletType
  },
  createWalletName: {
    cleanedPrivateKey?: string,
    selectedFiat: GuiFiatType,
    selectedWalletType: CreateWalletType
  },
  createWalletReview: {
    cleanedPrivateKey?: string, // for creating wallet from import private key
    selectedFiat: GuiFiatType,
    selectedWalletType: CreateWalletType,
    walletName: string
  },
  createWalletSelectCrypto: void,
  createWalletSelectFiat: {
    selectedWalletType: CreateWalletType,
    cleanedPrivateKey?: string
  },
  currencyNotificationSettings: {
    currencyInfo: EdgeCurrencyInfo
  },
  currencySettings: {
    currencyInfo: EdgeCurrencyInfo
  },
  defaultFiatSetting: void,
  edgeLogin: void,
  editToken: {
    currencyCode?: string,
    displayName?: string,
    multiplier?: string,
    networkLocation?: JsonObject,
    tokenId?: string, // Acts like "add token" if this is missing
    walletId: string
  },
  exchange: void,
  exchangeQuote: {
    swapInfo: GuiSwapInfo,
    onApprove: () => void
  },
  exchangeQuoteProcessing: void,
  exchangeScene: void,
  exchangeSettings: void,
  exchangeSuccess: void,
  fioAddressDetails: {
    fioAddressName: string,
    bundledTxs: number
  },
  fioAddressList: void,
  fioAddressRegister: void,
  fioAddressRegisterSelectWallet: {
    fioAddress: string,
    selectedWallet: EdgeCurrencyWallet,
    selectedDomain: FioDomain,
    isFallback?: boolean
  },
  fioAddressRegisterSuccess: {
    fioName: string,
    expiration?: string
  },
  fioAddressSettings: {
    fioWallet: EdgeCurrencyWallet,
    fioAddressName: string,
    bundledTxs?: number,
    showAddBundledTxs?: boolean,
    refreshAfterAddBundledTxs?: boolean
  },
  fioConnectToWalletsConfirm: {
    fioWallet: EdgeCurrencyWallet,
    fioAddressName: string,
    walletsToConnect: FioConnectionWalletItem[],
    walletsToDisconnect: FioConnectionWalletItem[]
  },
  fioDomainConfirm: {
    fioName: string,
    paymentWallet: EdgeCurrencyWallet,
    fee: number,
    ownerPublicKey: string
  },
  fioDomainRegister: void,
  fioDomainRegisterSelectWallet: {
    fioDomain: string,
    selectedWallet: EdgeCurrencyWallet
  },
  fioDomainSettings: {
    fioWallet: EdgeCurrencyWallet,
    fioDomainName: string,
    isPublic: boolean,
    expiration: string,
    showRenew?: boolean
  },
  fioNameConfirm: {
    fioName: string,
    paymentWallet: EdgeCurrencyWallet,
    fee: number,
    ownerPublicKey: string
  },
  fioRequestConfirmation: {
    amounts: ExchangedFlipInputAmounts
  },
  fioRequestList: void,
  fioRequestApproved: {
    edgeTransaction: EdgeTransaction,
    thumbnailPath?: string
  },
  fioSentRequestDetails: {
    selectedFioSentRequest: FioRequest
  },
  fioStakingChange: {
    change: 'add' | 'remove',
    currencyCode: string,
    walletId: string
  },
  fioStakingOverview: {
    currencyCode: string,
    walletId: string
  },
  guiPluginEnterAmount: {
    headerTitle: string,
    onSubmit: (response: FiatPluginEnterAmountResponse) => Promise<void>,
    label1: string,
    label2: string,
    onChangeText: (fieldNum: number, value: string) => Promise<void>,
    convertValue: (sourceFieldNum: number, value: string) => Promise<string | undefined>,
    getMethods?: (methods: FiatPluginGetMethodsResponse) => void,
    initialAmount1?: string,
    headerIconUri?: string
  },
  loanDashboard: void,
  loanDetails: {
    loanAccountId: string
  },
  loanCreate: {
    borrowEngine: BorrowEngine,
    borrowPlugin: BorrowPlugin
  },
  loanCreateConfirmation: {
    borrowEngine: BorrowEngine,
    borrowPlugin: BorrowPlugin,
    destTokenId: string,
    destWallet: EdgeCurrencyWallet,
    isDestBank: boolean,
    nativeDestAmount: string,
    nativeSrcAmount: string,
    srcTokenId?: string,
    srcWallet: EdgeCurrencyWallet
  },
  loanClose: {
    loanAccountId: string
  },
  loanAddCollateralScene: {
    loanAccountId: string
  },
  loanBorrowMoreScene: {
    loanAccountId: string
  },
  loanWithdrawCollateralScene: {
    loanAccountId: string
  },
  loanRepayScene: {
    loanAccountId: string
  },
  loanStatus: {
    actionQueueId: string
  },
  loanCreateStatus: {
    actionQueueId: string
  },
  loanDetailsStatus: {
    actionQueueId: string
  },
  manageTokens: {
    walletId: string
  },
  notificationSettings: void,
  otpRepair: {
    otpError: OtpError
  },
  otpSetup: void,
  passwordRecovery: void,
  pluginListBuy: { direction: 'buy' },
  pluginListSell: { direction: 'sell' },
  pluginViewBuy: PluginViewParams,
  pluginViewSell: PluginViewParams,
  pluginView: PluginViewParams,
  promotionSettings: void,
  request: void,
  scan: {
    data?: 'sweepPrivateKey' | 'loginQR'
  }, // TODO
  securityAlerts: void,
  send: {
    allowedCurrencyCodes?: string[],
    guiMakeSpendInfo?: GuiMakeSpendInfo,
    selectedWalletId?: string,
    selectedCurrencyCode?: string,
    isCameraOpen?: boolean,
    lockTilesMap?: {
      address?: boolean,
      wallet?: boolean,
      amount?: boolean
    },
    hiddenTilesMap?: {
      address?: boolean,
      amount?: boolean,
      fioAddressSelect?: boolean
    },
    infoTiles?: Array<{ label: string, value: string }>
  },
  settingsOverview: void,
  settingsOverviewTab: void,
  spendingLimits: void,
  stakeModify: {
    walletId: string,
    stakePolicy: StakePolicy,
    stakePosition: StakePosition,
    modification: ChangeQuoteRequest[ 'action']
  },
  stakeClaim: { walletId: string, stakePolicy: StakePolicy },
  stakeOptions: { walletId: string, currencyCode: string },
  stakeOverview: { walletId: string, stakePolicy: StakePolicy },
  termsOfService: void,
  testScene: void,
  transactionDetails: {
    edgeTransaction: EdgeTransaction,
    thumbnailPath?: string
  },
  transactionList: void,
  transactionsExport: {
    sourceWallet: EdgeCurrencyWallet,
    currencyCode: string
  },
  walletList: void,
  walletListScene: void,
  wcConnections: void,
  wcDisconnect: { wcConnectionInfo: WcConnectionInfo },
  wcConnect: {
    uri: string
  }
}

/**
 * The global `Actions` object for navigation.
 */
export const Actions = {
  get currentParams(): any {
    // @ts-expect-error
    return Flux.Actions.currentParams
  },
  get currentScene(): keyof ParamList {
    // @ts-expect-error
    return Flux.Actions.currentScene
  },

  drawerClose() {
    // @ts-expect-error
    Flux.Actions.drawerClose()
  },
  drawerOpen() {
    // @ts-expect-error
    Flux.Actions.drawerOpen()
  },

  jump<Name: keyof ParamList>(name: Name, params: $ElementType<ParamList, Name>): void {
    // @ts-expect-error
    Flux.Actions.jump(name, { route: { name, params } })
  },
  push<Name: keyof ParamList>(name: Name, params: $ElementType<ParamList, Name>): void {
    // @ts-expect-error
    Flux.Actions.push(name, { route: { name, params } })
  },
  replace<Name: keyof ParamList>(name: Name, params: $ElementType<ParamList, Name>): void {
    // @ts-expect-error
    Flux.Actions.replace(name, { route: { name, params } })
  },

  refresh(params: any): void {
    // @ts-expect-error
    Flux.Actions.refresh({ route: { name: Flux.Actions.currentScene, params } })
  },

  pop(): void {
    // @ts-expect-error
    Flux.Actions.pop()
  },
  popTo(name: keyof ParamList): void {
    // @ts-expect-error
    Flux.Actions.popTo(name)
  }
}

type NavigationEvent = 'didBlur' | 'didFocus' | 'willBlur' | 'willFocus'

/**
 * The of the `navigation` prop passed to each scene.
 */
export type NavigationProp<Name: keyof ParamList> = {
  // Whether this scene is in the foreground:
  addListener: (event: NavigationEvent, callback: () => void) => () => void,
  isFocused: () => boolean,

  // Going places:
  navigate: <Name: keyof ParamList>(name: Name, params: $ElementType<ParamList, Name>) => void,
  push: <Name: keyof ParamList>(name: Name, params: $ElementType<ParamList, Name>) => void,
  replace: <Name: keyof ParamList>(name: Name, params: $ElementType<ParamList, Name>) => void,
  setParams: (params: $ElementType<ParamList, Name>) => void,

  // Returning:
  goBack: () => void,
  pop: () => void,
  popToTop: () => void,

  // Drawer:
  closeDrawer: () => void,
  openDrawer: () => void,
  toggleDrawer: () => void,

  // Internals nobody should need to touch:
  state: unknown
}

/**
 * The of the `route` prop passed to each scene.
 */
export type RouteProp<Name: keyof ParamList> = {
  name: Name,
  params: $ElementType<ParamList, Name>
}

/**
 * Adjusts the navigation prop to match the definitions above.
 */
export function withNavigation<Props>(Component: React.ComponentType<Props>): React.StatelessFunctionalComponent<Props> {
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
