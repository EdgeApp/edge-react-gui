import { asValue } from 'cleaners'
import { EdgeAccount } from 'edge-core-js'
import {
  EdgeAssetAction,
  EdgeMetadata,
  EdgeTokenId,
  EdgeTransaction,
  EdgeTxAction
} from 'edge-core-js/types'
import { PluginPromotion } from 'edge-info-server'

import { DisablePluginMap } from '../../actions/ExchangeInfoActions'
import { LaunchPaymentProtoParams } from '../../actions/PaymentProtoActions'
import {
  ButtonInfo,
  ButtonModalProps
} from '../../components/modals/ButtonsModal'
import { SendScene2Params } from '../../components/scenes/SendScene2'
import { Permission } from '../../reducers/PermissionsReducer'
import { FiatProviderLink } from '../../types/DeepLinkTypes'
import { HomeAddress, SepaInfo } from '../../types/FormTypes'
import { GuiPlugin } from '../../types/GuiPluginTypes'
import { AppParamList } from '../../types/routerTypes'
import { EdgeAsset } from '../../types/types'
import {
  BuyConversionValues,
  SellConversionValues,
  TrackingEventName
} from '../../util/tracking'
import { FiatPluginAddressFormParams } from './scenes/AddressFormScene'
import { FiatPluginOpenWebViewParams } from './scenes/FiatPluginWebView'
import { FiatPluginSepaTransferParams } from './scenes/InfoDisplayScene'
import { RewardsCardDashboardParams } from './scenes/RewardsCardDashboardScene'
import { RewardsCardWelcomeParams } from './scenes/RewardsCardWelcomeScene'
import { FiatPluginSepaFormParams } from './scenes/SepaFormScene'

export const asFiatDirection = asValue('buy', 'sell')
export type FiatDirection = ReturnType<typeof asFiatDirection>

export const asFiatPaymentType = asValue(
  'ach',
  'applepay',
  'colombiabank',
  'credit',
  'directtobank',
  'fasterpayments',
  'googlepay',
  'iach',
  'ideal',
  'interac',
  'iobank',
  'mexicobank',
  'payid',
  'paypal',
  'pix',
  'pse',
  'revolut',
  'sepa',
  'spei',
  'turkishbank',
  'venmo',
  'wire'
)
export type FiatPaymentType = ReturnType<typeof asFiatPaymentType>

export type LinkHandler = (url: FiatProviderLink) => void

export interface FiatPluginSepaTransferInfo {
  input: {
    amount: string
    currency: string
  }
  output: {
    amount: string
    currency: string
    walletAddress: string
  }
  paymentDetails: {
    id: string
    iban: string
    swiftBic: string
    recipient: string
    reference: string
  }
}

export interface FiatPluginListModalParams {
  title: string
  items: Array<{
    icon: string | number | React.ReactNode
    name: string
    text?: string
  }> // Icon strings are image uri, numbers are local files
  selected?: string // Must match one of the name param in the items array
}

export interface FiatPluginEnterAmountResponse {
  lastUsed: number
  value1: string
  value2: string
}

export interface FiatPluginOpenExternalWebViewParams {
  url: string

  /**
   * Use a webview that is fully external to the app instead of any semi integrated
   * webview like a SafariWebView. If set, this will not kill the app but only
   * redirect to the external webview.
   */
  redirectExternal?: boolean

  /**
   * @param url
   * @returns void
   *
   * providerId is required if deeplinkHandler is provided
   */
  deeplinkHandler?: LinkHandler
  providerId?: string
}

export interface FiatPluginWalletPickerResult {
  walletId: string
  tokenId: EdgeTokenId
}

export interface SaveTxMetadataParams {
  txid: string
  walletId: string
  tokenId: EdgeTokenId
  metadata?: EdgeMetadata
}

export interface SaveTxActionParams {
  txid: string
  walletId: string
  tokenId: EdgeTokenId
  savedAction: EdgeTxAction
  assetAction: EdgeAssetAction
}

export type FiatPluginPermissions = Permission[]

export interface FiatPluginUi {
  addressWarnings: (parsedUri: any, currencyCode: string) => Promise<boolean>
  buttonModal: <Buttons extends { [key: string]: ButtonInfo }>(
    params: Omit<ButtonModalProps<Buttons>, 'bridge'>
  ) => Promise<keyof Buttons | undefined>
  confirmation: (params: { title: string; message: string }) => Promise<void>
  showToastSpinner: <T>(message: string, promise: Promise<T>) => Promise<T>
  openWebView: (params: FiatPluginOpenWebViewParams) => Promise<void>
  openExternalWebView: (
    params: FiatPluginOpenExternalWebViewParams
  ) => Promise<void>
  walletPicker: (params: {
    headerTitle: string
    allowedAssets?: EdgeAsset[]
    showCreateWallet?: boolean
  }) => Promise<FiatPluginWalletPickerResult | undefined>
  showError: (error: unknown) => Promise<void>
  listModal: (params: FiatPluginListModalParams) => Promise<string | undefined>
  enterAmount: (params: AppParamList['guiPluginEnterAmount']) => void
  emailForm: (params: {
    message?: string
  }) => Promise<
    { email: string; firstName: string; lastName: string } | undefined
  >
  addressForm: (
    params: FiatPluginAddressFormParams
  ) => Promise<HomeAddress | undefined>
  requestPermission: (
    permissions: FiatPluginPermissions,
    displayName: string,
    mandatory: boolean
  ) => Promise<boolean>
  rewardsCardDashboard: (params: RewardsCardDashboardParams) => Promise<void>
  rewardsCardWelcome: (params: RewardsCardWelcomeParams) => Promise<void>
  saveTxAction: (params: SaveTxActionParams) => Promise<void>
  saveTxMetadata: (params: SaveTxMetadataParams) => Promise<void>
  send: (params: SendScene2Params) => Promise<EdgeTransaction>
  sendPaymentProto: (params: {
    uri: string
    params: LaunchPaymentProtoParams
  }) => Promise<void>
  sepaForm: (params: FiatPluginSepaFormParams) => Promise<SepaInfo | undefined>
  sepaTransferInfo: (params: FiatPluginSepaTransferParams) => Promise<void>
  setClipboard: (value: string) => Promise<void>
  showToast: (message: string, autoHideMs?: number) => Promise<void>
  trackConversion: (
    event: TrackingEventName,
    opts: {
      conversionValues: SellConversionValues | BuyConversionValues
    }
  ) => Promise<void>
  exitScene: () => {}
  waitForAnimationFrame: () => Promise<void>
}

export interface FiatPluginUtils {
  getHistoricalRate: (codePair: string, date: string) => Promise<number>
}

export interface FiatPluginFactoryArgs {
  // TODO:
  // io: {
  //   log: EdgeLog, // scoped logs
  // }
  account: EdgeAccount
  deviceId: string
  disablePlugins: DisablePluginMap
  longPress?: boolean
  guiPlugin: GuiPlugin
  showUi: FiatPluginUi
  pluginUtils: FiatPluginUtils
}

export interface FiatPluginRegionCode {
  countryCode: string
  stateProvinceCode?: string
}
export interface FiatPluginStartParams {
  direction: 'buy' | 'sell'
  defaultIsoFiat: string
  paymentTypes: FiatPaymentType[]
  regionCode: FiatPluginRegionCode
  forceFiatCurrencyCode?: string
  defaultFiatAmount?: string
  pluginPromotions?: PluginPromotion[]
  providerId?: string
}
export interface FiatPlugin {
  pluginId: string
  startPlugin: (params: FiatPluginStartParams) => Promise<void>
}

export type FiatPluginFactory = (
  params: FiatPluginFactoryArgs
) => Promise<FiatPlugin>
