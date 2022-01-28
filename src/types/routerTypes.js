// @flow

import { type EdgeCurrencyInfo, type EdgeCurrencyWallet, type EdgeMetaToken, type EdgeTransaction, type JsonObject, type OtpError } from 'edge-core-js'
import * as React from 'react'
import * as Flux from 'react-native-router-flux'

import type { ExchangedFlipInputAmounts } from '../components/themed/ExchangedFlipInput.js'
import { type GuiPlugin, type GuiPluginQuery } from './GuiPluginTypes.js'
import {
  type CreateWalletType,
  type FeeOption,
  type FioConnectionWalletItem,
  type FioDomain,
  type FioRequest,
  type GuiFiatType,
  type GuiMakeSpendInfo,
  type GuiSwapInfo,
  type WcConnectionInfo
} from './types.js'
/**
 * Defines the acceptable route parameters for each scene key.
 */
export type ParamList = {
  // Top-level router:
  root: void,
  login: void,
  edge: void,
  // Logged-in scenes:
  addToken: {|
    contractAddress?: string,
    currencyCode?: string,
    currencyName?: string,
    decimalPlaces?: string,
    walletId: string
  |},
  changeMiningFee: {|
    guiMakeSpendInfo: GuiMakeSpendInfo,
    maxSpendSet: boolean,
    onSubmit: (networkFeeOption: FeeOption, customNetworkFee: JsonObject) => void,
    wallet: EdgeCurrencyWallet
  |},
  changePassword: void,
  changePin: void,
  controlPanel: void,
  createWalletAccountSelect: {|
    accountName: string,
    existingWalletId?: string,
    selectedFiat: GuiFiatType,
    selectedWalletType: CreateWalletType
  |},
  createWalletAccountSetup: {|
    accountHandle?: string,
    existingWalletId?: string,
    isReactivation?: boolean,
    selectedFiat: GuiFiatType,
    selectedWalletType: CreateWalletType
  |},
  createWalletChoice: {|
    selectedWalletType: CreateWalletType
  |},
  createWalletImport: {|
    selectedWalletType: CreateWalletType
  |},
  createWalletName: {|
    cleanedPrivateKey?: string,
    selectedFiat: GuiFiatType,
    selectedWalletType: CreateWalletType
  |},
  createWalletReview: {|
    cleanedPrivateKey?: string, // for creating wallet from import private key
    selectedFiat: GuiFiatType,
    selectedWalletType: CreateWalletType,
    walletName: string
  |},
  createWalletSelectCrypto: void,
  createWalletSelectFiat: {|
    selectedWalletType: CreateWalletType,
    cleanedPrivateKey?: string
  |},
  currencyNotificationSettings: {|
    currencyInfo: EdgeCurrencyInfo
  |},
  currencySettings: {|
    currencyInfo: EdgeCurrencyInfo
  |},
  defaultFiatSetting: void,
  edgeLogin: void,
  editToken: {|
    currencyCode: string,
    metaTokens: EdgeMetaToken[],
    walletId: string
  |},
  exchange: void,
  exchangeQuote: {|
    swapInfo: GuiSwapInfo,
    onApprove: () => void
  |},
  exchangeQuoteProcessing: void,
  exchangeScene: void,
  exchangeSettings: void,
  exchangeSuccess: void,
  fioAddressDetails: {|
    fioAddressName: string,
    bundledTxs: number
  |},
  fioAddressList: void,
  fioAddressRegister: void,
  fioAddressRegisterSelectWallet: {|
    fioAddress: string,
    selectedWallet: EdgeCurrencyWallet,
    selectedDomain: FioDomain,
    isFallback?: boolean
  |},
  fioAddressRegisterSuccess: {|
    fioName: string,
    expiration?: string
  |},
  fioAddressSettings: {|
    fioWallet: EdgeCurrencyWallet,
    fioAddressName: string,
    bundledTxs?: number,
    showAddBundledTxs?: boolean,
    refreshAfterAddBundledTxs?: boolean
  |},
  fioConnectToWalletsConfirm: {|
    fioWallet: EdgeCurrencyWallet,
    fioAddressName: string,
    walletsToConnect: FioConnectionWalletItem[],
    walletsToDisconnect: FioConnectionWalletItem[]
  |},
  fioDomainConfirm: {|
    fioName: string,
    paymentWallet: EdgeCurrencyWallet,
    fee: number,
    ownerPublicKey: string
  |},
  fioDomainRegister: void,
  fioDomainRegisterSelectWallet: {|
    fioDomain: string,
    selectedWallet: EdgeCurrencyWallet
  |},
  fioDomainSettings: {|
    fioWallet: EdgeCurrencyWallet,
    fioDomainName: string,
    isPublic: boolean,
    expiration: string,
    showRenew?: boolean
  |},
  fioNameConfirm: {|
    fioName: string,
    paymentWallet: EdgeCurrencyWallet,
    fee: number,
    ownerPublicKey: string
  |},
  fioRequestConfirmation: {|
    amounts: ExchangedFlipInputAmounts
  |},
  fioRequestList: void,
  fioRequestApproved: {|
    edgeTransaction: EdgeTransaction,
    thumbnailPath?: string
  |},
  fioSentRequestDetails: {|
    selectedFioSentRequest: FioRequest
  |},
  manageTokens: {|
    walletId: string
  |},
  notificationSettings: void,
  otpRepair: {|
    otpError: OtpError
  |},
  otpSetup: void,
  passwordRecovery: void,
  pluginBuy: {| direction: 'buy' |},
  pluginSell: {| direction: 'sell' |},
  pluginView: {|
    // The GUI plugin we are showing the user:
    plugin: GuiPlugin,

    // Set these to add stuff to the plugin URI:
    deepPath?: string,
    deepQuery?: GuiPluginQuery
  |},
  promotionSettings: void,
  request: void,
  scan: {|
    data?: 'sweepPrivateKey' | 'loginQR'
  |}, // TODO
  securityAlerts: void,
  send: {|
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
  |},
  settingsOverview: void,
  settingsOverviewTab: void,
  spendingLimits: void,
  stakingChange: {
    change: 'add' | 'remove',
    currencyCode: string,
    walletId: string
  },
  stakingOverview: {
    currencyCode: string,
    walletId: string
  },
  termsOfService: void,
  transactionDetails: {|
    edgeTransaction: EdgeTransaction,
    thumbnailPath?: string
  |},
  transactionList: void,
  transactionsExport: {|
    sourceWallet: EdgeCurrencyWallet,
    currencyCode: string
  |},
  walletList: void,
  walletListScene: void,
  wcConnections: void,
  wcDisconnect: {| wcConnectionInfo: WcConnectionInfo |},
  wcConnect: {|
    uri: string
  |}
}

/**
 * The global `Actions` object for navigation.
 */
export const Actions = {
  get currentParams(): any {
    // $FlowFixMe
    return Flux.Actions.currentParams
  },
  get currentScene(): $Keys<ParamList> {
    // $FlowFixMe
    return Flux.Actions.currentScene
  },

  drawerClose() {
    // $FlowFixMe
    Flux.Actions.drawerClose()
  },
  drawerOpen() {
    // $FlowFixMe
    Flux.Actions.drawerOpen()
  },

  jump<Name: $Keys<ParamList>>(name: Name, params: $ElementType<ParamList, Name>): void {
    // $FlowFixMe
    Flux.Actions.jump(name, { route: { name, params } })
  },
  push<Name: $Keys<ParamList>>(name: Name, params: $ElementType<ParamList, Name>): void {
    // $FlowFixMe
    Flux.Actions.push(name, { route: { name, params } })
  },
  replace<Name: $Keys<ParamList>>(name: Name, params: $ElementType<ParamList, Name>): void {
    // $FlowFixMe
    Flux.Actions.replace(name, { route: { name, params } })
  },

  refresh(params: any): void {
    // $FlowFixMe
    Flux.Actions.refresh({ route: { name: Flux.Actions.currentScene, params } })
  },

  pop(): void {
    // $FlowFixMe
    Flux.Actions.pop()
  },
  popTo(name: $Keys<ParamList>): void {
    // $FlowFixMe
    Flux.Actions.popTo(name)
  }
}

type NavigationEvent = 'didBlur' | 'didFocus' | 'willBlur' | 'willFocus'

/**
 * The type of the `navigation` prop passed to each scene.
 */
export type NavigationProp<Name: $Keys<ParamList>> = {
  // Whether this scene is in the foreground:
  addListener: (event: NavigationEvent, callback: () => void) => () => void,
  isFocused: () => boolean,

  // Going places:
  navigate: <Name: $Keys<ParamList>>(name: Name, params: $ElementType<ParamList, Name>) => void,
  push: <Name: $Keys<ParamList>>(name: Name, params: $ElementType<ParamList, Name>) => void,
  replace: <Name: $Keys<ParamList>>(name: Name, params: $ElementType<ParamList, Name>) => void,
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
  state: mixed
}

/**
 * The type of the `route` prop passed to each scene.
 */
export type RouteProp<Name: $Keys<ParamList>> = {
  name: Name,
  params: $ElementType<ParamList, Name>
}

/**
 * Adjusts the navigation prop to match the type definitions above.
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
      replace(name, params) {
        props.navigation.replace(name, { route: { name, params } })
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
