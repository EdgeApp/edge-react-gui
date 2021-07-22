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
  addToken: {}, // TODO
  changeMiningFee: {}, // TODO
  changePassword: void,
  changePin: void,
  createWalletAccountSelect: {}, // TODO
  createWalletAccountSetup: {}, // TODO
  createWalletChoice: {}, // TODO
  createWalletImport: {}, // TODO
  createWalletName: {}, // TODO
  createWalletReview: {}, // TODO
  createWalletSelectCrypto: void,
  createWalletSelectFiat: {}, // TODO
  currencyNotificationSettings: {}, // TODO
  currencySettings: {}, // TODO
  defaultFiatSetting: void,
  edgeLogin: void,
  editToken: {}, // TODO
  exchange: void,
  exchangeQuote: {}, // TODO
  exchangeQuoteProcessing: void,
  exchangeScene: void,
  exchangeSettings: void,
  exchangeSuccess: void,
  fioAddressDetails: {}, // TODO
  fioAddressList: void,
  fioAddressRegister: {}, // TODO
  fioAddressRegisterSelectWallet: {}, // TODO
  fioAddressRegisterSuccess: {}, // TODO
  fioAddressSettings: {}, // TODO
  fioConnectToWalletsConfirm: {}, // TODO
  fioDomainConfirm: {}, // TODO
  fioDomainRegister: void,
  fioDomainRegisterSelectWallet: {}, // TODO
  fioDomainSettings: {}, // TODO
  fioNameConfirm: {}, // TODO
  fioRequestConfirmation: {}, // TODO
  fioRequestList: void,
  fioSentRequestDetails: {}, // TODO
  manageTokens: {}, // TODO
  notificationSettings: void,
  otpRepair: {}, // TODO
  otpSetup: void,
  passwordRecovery: void,
  pluginBuy: void,
  pluginSell: void,
  pluginView: {}, // TODO
  pluginViewDeep: {}, // TODO
  promotionSettings: void,
  request: void,
  scan: {}, // TODO
  securityAlerts: void,
  send: {}, // TODO
  settingsOverview: void,
  settingsOverviewTab: void,
  spendingLimits: void,
  termsOfService: void,
  transactionDetails: {}, // TODO
  transactionList: void,
  transactionsExport: {}, // TODO
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
type Remover = { remove: () => void }

/**
 * The type of the `navigation` prop passed to each scene.
 */
export type NavigationProp<Name: $Keys<ParamList>> = {
  // Whether this scene is in the foreground:
  addListener: (event: NavigationEvent, callback: () => void) => Remover,
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
