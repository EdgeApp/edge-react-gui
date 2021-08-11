// @flow

import * as Flux from 'react-native-router-flux'

/**
 * Defines the acceptable route parameters for each scene key.
 */
export type ParamList = {
  // Top-level router:
  root: void,
  login: void,
  edge: void,

  // Logged-in scenes:
  addToken: void,
  changeMiningFee: void,
  changePassword: void,
  changePin: void,
  createWalletAccountSelect: void,
  createWalletAccountSetup: void,
  createWalletChoice: void,
  createWalletImport: void,
  createWalletName: void,
  createWalletReview: void,
  createWalletSelectCrypto: void,
  createWalletSelectFiat: void,
  currencyNotificationSettings: void,
  currencySettings: void,
  defaultFiatSetting: void,
  edgeLogin: void,
  editToken: void,
  exchange: void,
  exchangeQuote: void,
  exchangeQuoteProcessing: void,
  exchangeScene: void,
  exchangeSettings: void,
  exchangeSuccess: void,
  fioAddressDetails: void,
  fioAddressList: void,
  fioAddressRegister: void,
  fioAddressRegisterSelectWallet: void,
  fioAddressRegisterSuccess: void,
  fioAddressSettings: void,
  fioConnectToWalletsConfirm: void,
  fioDomainConfirm: void,
  fioDomainRegister: void,
  fioDomainRegisterSelectWallet: void,
  fioDomainSettings: void,
  fioNameConfirm: void,
  fioRequestConfirmation: void,
  fioRequestList: void,
  fioSentRequestDetails: void,
  manageTokens: void,
  notificationSettings: void,
  otpRepair: void,
  otpSetup: void,
  passwordRecovery: void,
  pluginBuy: void,
  pluginSell: void,
  pluginView: void,
  pluginViewDeep: void,
  promotionSettings: void,
  request: void,
  scan: void,
  securityAlerts: void,
  send: void,
  settingsOverview: void,
  settingsOverviewTab: void,
  spendingLimits: void,
  currencySettingsSelectFiat: void,
  termsOfService: void,
  transactionDetails: void,
  transactionList: void,
  transactionsExport: void,
  walletList: void,
  walletListScene: void
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

  jump(name: $Keys<ParamList>, params: any): void {
    // $FlowFixMe
    Flux.Actions.jump(name, params)
  },
  push(name: $Keys<ParamList>, params: any): void {
    // $FlowFixMe
    Flux.Actions.push(name, params)
  },
  replace(name: $Keys<ParamList>, params: any): void {
    // $FlowFixMe
    Flux.Actions.replace(name, params)
  },

  refresh(params: any): void {
    // $FlowFixMe
    Flux.Actions.refresh(params)
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
type Remover = { remove: () => void }

/**
 * The type of the `navigation` prop passed to each scene.
 */
export type NavigationProp = {
  // Whether this scene is in the foreground:
  addListener: (event: NavigationEvent, callback: () => void) => Remover,
  isFocused: () => boolean,

  // Going places:
  navigate: (name: $Keys<ParamList>, params: any) => void,
  push: (name: $Keys<ParamList>, params: any) => void,
  replace: (name: $Keys<ParamList>, params: any) => void,
  setParams: (params: any) => void,

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
