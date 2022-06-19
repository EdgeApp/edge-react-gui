// @flow
import { type EdgeAccount } from 'edge-core-js'

import { type EdgeTokenId } from '../../types/types.js'
import { type EnterAmountPoweredBy } from './scenes/EnterAmountScene'

export type FiatPluginGetMethodsResponse = {
  setStatusText: (params: { statusText: string, options?: { textType?: 'warning' | 'error' } }) => void,
  setPoweredBy: (params: EnterAmountPoweredBy) => void
}
export type FiatPluginEnterAmountParams = {
  headerTitle: string,
  label1: string,
  label2: string,
  convertValue: (sourceFieldNum: number, value: string) => Promise<string | void>,
  getMethods?: (methods: FiatPluginGetMethodsResponse) => void,
  initialAmount1?: string,
  headerIconUri?: string
}

// export type FiatPluginListModalRow = { icon: string | number, name: string }
export type FiatPluginListModalParams = {
  title: string,
  items: Array<{ icon: string | number | React.Node, name: string, text?: string }>, // Icon strings are image uri, numbers are local files
  selected?: string // Must match one of the name param in the items array
}

export type FiatPluginEnterAmountResponse = { lastUsed: number, value1: string, value2: string }
export type FiatPluginOpenWebViewParams = { url: string }
export type FiatPluginUi = {
  openWebView: FiatPluginOpenWebViewParams => Promise<void>,
  walletPicker: (params: { headerTitle: string, allowedAssets?: EdgeTokenId[], showCreateWallet?: boolean }) => Promise<{
    walletId: string | void,
    currencyCode: string | void
  }>,
  errorDropdown: (error: Error) => Promise<void>,
  listModal: (params: FiatPluginListModalParams) => Promise<string | void>,
  enterAmount: (params: FiatPluginEnterAmountParams) => Promise<FiatPluginEnterAmountResponse>,
  popScene: () => {}
  // showWebView: (params: { webviewUrl: string }) => Promise<void>
}

export type FiatPluginFactoryArgs = {
  // TODO:
  // io: {
  //   log: EdgeLog, // scoped logs
  // }
  showUi: FiatPluginUi,
  account: EdgeAccount
}

export type FiatPlugin = {
  pluginId: string,
  startPlugin: () => Promise<void>
}

export type FiatPluginFactory = (params: FiatPluginFactoryArgs) => Promise<FiatPlugin>
