import { asValue } from 'cleaners'
import { EdgeAccount } from 'edge-core-js'
import { EdgeTokenId, EdgeTransaction } from 'edge-core-js/types'

import { DisablePluginMap } from '../../actions/ExchangeInfoActions'
import { LaunchPaymentProtoParams } from '../../actions/PaymentProtoActions'
import { ButtonInfo, ButtonModalProps } from '../../components/modals/ButtonsModal'
import { SendScene2Params } from '../../components/scenes/SendScene2'
import { HomeAddress, SepaInfo } from '../../types/FormTypes'
import { GuiPlugin } from '../../types/GuiPluginTypes'
import { AppParamList } from '../../types/routerTypes'
import { EdgeAsset } from '../../types/types'
import { TrackingEventName } from '../../util/tracking'
import { FiatPluginOpenWebViewParams } from './scenes/FiatPluginWebView'
import { RewardsCardDashboardParams } from './scenes/RewardsCardDashboardScene'
import { RewardsCardWelcomeParams } from './scenes/RewardsCardWelcomeScene'

export const asFiatDirection = asValue('buy', 'sell')
export type FiatDirection = ReturnType<typeof asFiatDirection>

export const asFiatPaymentType = asValue(
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
  'pix',
  'pse',
  'sepa',
  'spei',
  'turkishbank'
)
export type FiatPaymentType = ReturnType<typeof asFiatPaymentType>

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

export interface FiatPluginSepaTransferParams {
  headerTitle: string
  promptMessage: string
  transferInfo: FiatPluginSepaTransferInfo
  headerIconUri?: string
  onDone: () => Promise<void>
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

export interface FiatPluginOpenExternalWebViewParams {
  url: string
}

export interface FiatPluginWalletPickerResult {
  walletId: string
  tokenId: EdgeTokenId
  /** @deprecated Use tokenId instead */
  currencyCode: string
}

export interface FiatPluginUi {
  addressWarnings: (parsedUri: any, currencyCode: string) => Promise<boolean>
  buttonModal: <Buttons extends { [key: string]: ButtonInfo }>(params: Omit<ButtonModalProps<Buttons>, 'bridge'>) => Promise<keyof Buttons | undefined>
  showToastSpinner: <T>(message: string, promise: Promise<T>) => Promise<T>
  openWebView: (params: FiatPluginOpenWebViewParams) => Promise<void>
  openExternalWebView: (params: FiatPluginOpenExternalWebViewParams) => Promise<void>
  walletPicker: (params: { headerTitle: string; allowedAssets?: EdgeAsset[]; showCreateWallet?: boolean }) => Promise<FiatPluginWalletPickerResult | undefined>
  showError: (error: Error) => Promise<void>
  listModal: (params: FiatPluginListModalParams) => Promise<string | undefined>
  enterAmount: (params: AppParamList['guiPluginEnterAmount']) => void
  addressForm: (params: FiatPluginAddressFormParams) => Promise<HomeAddress>
  rewardsCardDashboard: (params: RewardsCardDashboardParams) => Promise<void>
  rewardsCardWelcome: (params: RewardsCardWelcomeParams) => Promise<void>
  send: (params: SendScene2Params) => Promise<EdgeTransaction>
  sendPaymentProto: (params: { uri: string; params: LaunchPaymentProtoParams }) => Promise<void>
  sepaForm: (params: FiatPluginSepaFormParams) => Promise<SepaInfo>
  sepaTransferInfo: (params: FiatPluginSepaTransferParams) => Promise<void>
  setClipboard: (value: string) => Promise<void>
  showToast: (message: string, autoHideMs?: number) => Promise<void>
  trackConversion: (
    event: TrackingEventName,
    opts: {
      destCurrencyCode: string
      destExchangeAmount: string
      destPluginId?: string
      sourceCurrencyCode: string
      sourceExchangeAmount: string
      sourcePluginId?: string
      pluginId: string
      orderId?: string
    }
  ) => Promise<void>

  exitScene: () => {}
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
}

export interface FiatPluginRegionCode {
  countryCode: string
  stateCode?: string
}
export interface FiatPluginStartParams {
  direction: 'buy' | 'sell'
  paymentTypes: FiatPaymentType[]
  regionCode: FiatPluginRegionCode
  forceFiatCurrencyCode?: string
  defaultFiatAmount?: string
  providerId?: string
}
export interface FiatPlugin {
  pluginId: string
  startPlugin: (params: FiatPluginStartParams) => Promise<void>
}

export type FiatPluginFactory = (params: FiatPluginFactoryArgs) => Promise<FiatPlugin>
