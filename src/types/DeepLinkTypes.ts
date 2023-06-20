/*
 * All Edge deep-linking features are available through the `edge://`
 * protocol. This protocol comes in three flavors, which are fully equivalent:
 *
 *   - edge://<type>/...
 *   - airbitz://<type>/...
 *   - https://deep.edge.app/<type>/...
 *
 * The `edge://` protocol supports the following link types:
 *
 *   - edge: Edge login
 *   - pay: Payment request
 *   - plugin: GUI plugin deep link
 *   - promotion: Activate a promotion code
 *   - recovery: Password recovery
 *   - swap: Crypto-to-crypto swap
 *   - x-callback-url: Address request
 *
 * The `edge://` protocol is the preferred way to link into the application,
 * but Edge also supports some feature-specific https domains:
 *
 *   - https://dl.edge.app/... = edge://promotion/...
 *   - https://dl.edge.app/?af=... = edge://promotion/...
 *   - https://recovery.edgesecure.co/... = edge://recovery/...
 *
 * We also support some legacy prefixes (but don't use these):
 *
 *   - https://www.edge.app/edgelogin?address=... = edge://edge/...
 *   - edge-ret://plugins/simplex/... = edge://plugin/simplex/...
 *   - edge-ret://x-callback-url/... = edge://x-callback-url/...
 *   - airbitz-ret://x-callback-url/... = edge://x-callback-url/...
 *
 * Besides the edge:// protocol, there are also various coin-specific URI
 * protocols like `bitcoin:`, which we just pass through as "other".
 */
import { PriceChangePayload } from '../controllers/action-queue/types/pushPayloadTypes'
import { FiatDirection, FiatPaymentType } from '../plugins/gui/fiatPluginTypes'
import { AppParamList } from './routerTypes'

export interface AztecoLink {
  type: 'azteco'
  uri: string
}

export interface PaymentProtoLink {
  type: 'paymentProto'
  uri: string
}

export interface EdgeLoginLink {
  type: 'edgeLogin'
  lobbyId: string
}

export interface PasswordRecoveryLink {
  type: 'passwordRecovery'
  passwordRecoveryKey: string
}

export interface PluginLink {
  type: 'plugin'
  pluginId: string
  path: string
  query: { [key: string]: string | null }
}

export interface FiatPluginLink {
  type: 'fiatPlugin'
  pluginId: string
  direction?: FiatDirection
  providerId?: string
  paymentType?: FiatPaymentType
}

export interface PromotionLink {
  type: 'promotion'
  installerId?: string
}
export interface RequestAddressLink {
  type: 'requestAddress'
  assets: Array<{ nativeCode: string; tokenCode: string }>
  post?: string // Either post or redir must be specified
  redir?: string
  payer?: string
}

export interface SwapLink {
  type: 'swap'
  // We may eventually add query parameters to pre-populate currencies.
}

export interface WalletConnectLink {
  type: 'walletConnect'
  uri: string
}

export interface DevLink {
  type: 'dev'
  sceneName: keyof AppParamList
}

export type DeepLink =
  | AztecoLink
  | DevLink
  | EdgeLoginLink
  | FiatPluginLink
  | PasswordRecoveryLink
  | PaymentProtoLink
  | PluginLink
  | PriceChangePayload
  | PromotionLink
  | RequestAddressLink
  | SwapLink
  | WalletConnectLink
  | {
      type: 'other'
      protocol: string // Without the ':'
      uri: string
    }
