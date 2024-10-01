/*
 * All Edge deep-linking features are available through the `edge://`
 * protocol. This protocol comes in three flavors, which are fully equivalent:
 *
 *   - edge://<type>/...
 *   - airbitz://<type>/...
 *   - https://deep.edge.app/<type>/...
 *   - https://dp.edge.app/<type>/...
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
 *
 * We also support some legacy prefixes (but don't use these):
 *
 *   - edge-ret://plugins/simplex/... = edge://plugin/simplex/...
 *   - edge-ret://x-callback-url/... = edge://x-callback-url/...
 *   - airbitz-ret://x-callback-url/... = edge://x-callback-url/...
 *
 * Besides the edge:// protocol, there are also various coin-specific URI
 * protocols like `bitcoin:`, which we just pass through as "other".
 */
import { asValue } from 'cleaners'

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

export interface FiatProviderLink {
  type: 'fiatProvider'
  direction: FiatDirection
  providerId: string
  path: string
  query: { [key: string]: string | null }
  uri: string
}

export interface PromotionLink {
  type: 'promotion'
  installerId?: string
}

export interface PriceChangeLink {
  type: 'price-change'
  pluginId: string
  body: string // Human-readable message
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

export interface NoopLink {
  type: 'noop'
}

export interface SceneLink {
  type: 'scene'
  sceneName: keyof AppParamList
  query: AppParamList[keyof AppParamList]
}

export const asModalNames = asValue('fundAccount', 'test')
export type ModalNames = ReturnType<typeof asModalNames>

export interface ModalLink {
  type: 'modal'
  modalName: ModalNames
}

export type DeepLink =
  | AztecoLink
  | SceneLink
  | EdgeLoginLink
  | FiatPluginLink
  | FiatProviderLink
  | ModalLink
  | NoopLink
  | PasswordRecoveryLink
  | PaymentProtoLink
  | PluginLink
  | PriceChangeLink
  | PromotionLink
  | RequestAddressLink
  | SwapLink
  | WalletConnectLink
  | {
      type: 'other'
      protocol: string // Without the ':'
      uri: string
    }
