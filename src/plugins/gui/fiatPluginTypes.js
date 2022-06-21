// @flow
import { type EdgeAccount } from 'edge-core-js'

import { type EdgeTokenId } from '../../types/types.js'

export type FiatPluginEnterAmountParams = {
  headerTitle: string,
  label1: string,
  label2: string,
  convertValue: (sourceFieldNum: number, value: string) => Promise<string | void>,
  initialAmount1?: string,
  headerIconUri?: string
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
