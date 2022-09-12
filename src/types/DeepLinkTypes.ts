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
import { ParamList } from './routerTypes'

export type AztecoLink = {
  type: 'azteco'
  uri: string
}

export type BitPayLink = {
  type: 'bitPay'
  uri: string
}

export type EdgeLoginLink = {
  type: 'edgeLogin'
  lobbyId: string
}

export type PasswordRecoveryLink = {
  type: 'passwordRecovery'
  passwordRecoveryKey: string
}

export type PluginLink = {
  type: 'plugin'
  pluginId: string
  path: string
  query: { [key: string]: string | null }
}

export type PromotionLink = {
  type: 'promotion'
  installerId?: string
}
export type RequestAddressLink = {
  type: 'requestAddress'
  assets: Array<{ nativeCode: string; tokenCode: string }>
  post?: string // Either post or redir must be specified
  redir?: string
  payer?: string
}

export type SwapLink = {
  type: 'swap'
  // We may eventually add query parameters to pre-populate currencies.
}

export type WalletConnectLink = {
  type: 'walletConnect'
  isSigning: boolean
  uri: string
}

export type DevLink = {
  type: 'dev'
  sceneName: keyof ParamList
}

export type DeepLink =
  | AztecoLink
  | BitPayLink
  | EdgeLoginLink
  | PasswordRecoveryLink
  | PluginLink
  | PromotionLink
  | RequestAddressLink
  | WalletConnectLink
  | SwapLink
  | DevLink
  | {
      type: 'other'
      protocol: string // Without the ':'
      uri: string
    }
