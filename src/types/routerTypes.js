// @flow

import { type EdgeCurrencyInfo, type EdgeCurrencyWallet, type EdgeMetaToken, type EdgeTransaction, type OtpError } from 'edge-core-js'

import { type ExchangedFlipInputAmounts } from '../components/themed/ExchangedFlipInput.js'
import { type GuiPlugin, type GuiPluginQuery } from './GuiPluginTypes.js'
import {
  type CreateWalletType,
  type FioConnectionWalletItem,
  type FioDomain,
  type FioRequest,
  type GuiFiatType,
  type GuiMakeSpendInfo,
  type GuiSwapInfo,
  type GuiWallet
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
    onAddToken: (currencyCode: string) => void,
    contractAddress?: string,
    currencyCode?: string,
    currencyName?: string,
    decimalPlaces?: string,
    walletId: string
  |},
  changeMiningFee: {|
    currencyCode?: string,
    wallet: EdgeCurrencyWallet
  |},
  changePassword: void,
  changePin: void,
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
    onDeleteToken(currencyCode: string): void,
    walletId: string
  |},
  exchange: void,
  exchangeQuote: {|
    swapInfo: GuiSwapInfo
  |},
  exchangeQuoteProcessing: void,
  exchangeScene: void,
  exchangeSettings: void,
  exchangeSuccess: void,
  fioAddressDetails: {|
    fioAddressName: string,
    expiration: string
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
    expiration: string
  |},
  fioAddressSettings: {|
    fioWallet: EdgeCurrencyWallet,
    fioAddressName: string,
    expiration?: string,
    showRenew?: boolean,
    refreshAfterRenew?: boolean
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
  fioSentRequestDetails: {|
    selectedFioSentRequest: FioRequest
  |},
  manageTokens: {|
    guiWallet: GuiWallet
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
    mode?: 'sweepPrivateKey' | 'loginQR'
  |},
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
  walletListScene: void
}

/**
 * The global `Actions` object for navigation.
 */
export const Actions = {
  get currentParams(): any {},
  get currentScene(): $Keys<ParamList> {
    return 'edge'
  },

  drawerClose() {},
  drawerOpen() {},

  jump<Name: $Keys<ParamList>>(name: Name, params: $ElementType<ParamList, Name>): void {},
  push<Name: $Keys<ParamList>>(name: Name, params: $ElementType<ParamList, Name>): void {},
  replace<Name: $Keys<ParamList>>(name: Name, params: $ElementType<ParamList, Name>): void {},

  refresh(params: any): void {},

  pop(): void {},
  popTo(name: $Keys<ParamList>): void {}
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
