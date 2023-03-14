import { asMaybe, asObject, asString, asValue } from 'cleaners'
import { EdgeAccount } from 'edge-core-js'

import { DisablePluginMap } from '../../actions/ExchangeInfoActions'
import { HomeAddress, SepaInfo } from '../../types/FormTypes'
import { EdgeTokenId } from '../../types/types'
import { EnterAmountPoweredBy } from './scenes/EnterAmountScene'

export const asFiatPaymentType = asValue('credit', 'applepay', 'googlepay', 'iach', 'sepa')
export type FiatPaymentType = ReturnType<typeof asFiatPaymentType>
export type FiatPaymentTypes = FiatPaymentType[]

export interface FiatSepaOwnerAddress extends HomeAddress {
  name: string
}

export const asFiatSepaInfo = asObject({
  iban: asString,
  swift: asString,
  ownerAddress: asObject<FiatSepaOwnerAddress>({
    name: asString,
    address: asString,
    address2: asMaybe(asString),
    city: asString,
    country: asString,
    postalCode: asString,
    state: asString
  })
})

export type FiatSepaInfo = ReturnType<typeof asFiatSepaInfo>

export interface FiatPluginGetMethodsResponse {
  setStatusText: (params: { statusText: string; options?: { textType?: 'warning' | 'error' } }) => void
  setPoweredBy: (params: EnterAmountPoweredBy) => void
  setValue1: (value: string) => void
  setValue2: (value: string) => void
}
export interface FiatPluginEnterAmountParams {
  headerTitle: string
  direction: 'buy' | 'sell'
  label1: string
  label2: string
  convertValue: (sourceFieldNum: number, value: string) => Promise<string | undefined>
  getMethods?: (methods: FiatPluginGetMethodsResponse) => void
  initialAmount1?: string
  headerIconUri?: string
}

export interface FiatPluginAddressFormParams {
  countryCode: string
  headerTitle: string
  headerIconUri?: string
  onSubmit: (homeAddress: HomeAddress) => Promise<void>
}

export interface FiatPluginSepaFormParams {
  headerTitle: string
  headerIconUri?: string
  onSubmit: (sepaInfo: SepaInfo) => Promise<void>
}

export interface FiatPluginSepaTransferParams {
  headerTitle: string
  promptMessage: string
  transferInfo: {
    input: {
      amount: string
      currency: string
    }
    output: {
      amount: string
      currency: string
    }
    paymentDetails: {
      id: string
      iban: string
      swiftBic: string
      recipient: string
      reference: string
    }
  }
  headerIconUri?: string
  onSubmit: () => Promise<void>
}

export interface FiatPluginListModalParams {
  title: string
  items: Array<{ icon: string | number | React.ReactNode; name: string; text?: string }> // Icon strings are image uri, numbers are local files
  selected?: string // Must match one of the name param in the items array
}

export interface FiatPluginEnterAmountResponse {
  lastUsed: number
  value1: string
  value2: string
}
export interface FiatPluginOpenWebViewParams {
  url: string
}
export interface FiatPluginFiatPickerParams {
  headerTitle: string
  allowedIsoFiats: string[]
}

export interface FiatPluginUi {
  showToastSpinner: <T>(message: string, promise: Promise<T>) => Promise<T>
  openWebView: (params: FiatPluginOpenWebViewParams) => Promise<void>
  fiatPicker: (params: FiatPluginFiatPickerParams) => Promise<string>
  walletPicker: (params: {
    headerTitle: string
    allowedAssets?: EdgeTokenId[]
    showCreateWallet?: boolean
  }) => Promise<{ currencyCode?: string; tokenId?: string; walletId?: string }>
  showError: (error: Error) => Promise<void>
  listModal: (params: FiatPluginListModalParams) => Promise<string | undefined>
  enterAmount: (params: FiatPluginEnterAmountParams) => Promise<FiatPluginEnterAmountResponse>
  popScene: () => {}
  // showWebView: (params: { webviewUrl: string }) => Promise<void>
}

export interface FiatPluginFactoryArgs {
  // TODO:
  // io: {
  //   log: EdgeLog, // scoped logs
  // }
  disablePlugins: DisablePluginMap
  showUi: FiatPluginUi
  account: EdgeAccount
}

export interface FiatPluginRegionCode {
  countryCode: string
  stateCode?: string
}
export interface FiatPluginStartParams {
  direction: 'buy' | 'sell'
  paymentTypes: FiatPaymentTypes
  regionCode: FiatPluginRegionCode
}
export interface FiatPlugin {
  pluginId: string
  startPlugin: (params: FiatPluginStartParams) => Promise<void>
}

export type FiatPluginFactory = (params: FiatPluginFactoryArgs) => Promise<FiatPlugin>
