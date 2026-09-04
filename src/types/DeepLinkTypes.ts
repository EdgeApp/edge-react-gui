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
 *   - buy: Buy flow entry, optionally pinning a ramp provider / payment type
 *   - edge: Edge login
 *   - pay: Payment request
 *   - plugin: GUI plugin deep link
 *   - promotion: Activate a promotion code
 *   - recovery: Password recovery
 *   - request-wallets: Another account asks us to share wallets with it
 *   - share-wallets: Another account offers to share wallets with us
 *   - sell: Sell flow entry, optionally pinning a ramp provider / payment type
 *   - swap: Crypto-to-crypto swap
 *   - x-callback-url: Address request
 *
 * The `edge://` protocol is the preferred way to link into the application,
 * but Edge also supports some feature-specific https domains:
 *
 *   - https://dl.edge.app/... = edge://promotion/...
 *   - https://dl.edge.app/?af=... = edge://promotion/...
 *
 * `deep.edge.app` URLs may also carry an `?af=<installerId>` query parameter.
 * When present alongside another payload (e.g. a `pay` private-key URI), the
 * deep link resolves to an `affiliate` wrapper that activates the promotion
 * and then delegates to the inner link.
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
import type { EdgeTokenId } from 'edge-core-js'

import type {
  FiatDirection,
  FiatPaymentType
} from '../plugins/gui/fiatPluginTypes'
import type { AppParamList } from './routerTypes'

export interface AztecoLink {
  type: 'azteco'
  uri: string
}

export interface PaymentProtoLink {
  type: 'paymentProto'
  uri: string
}

/**
 * A provider sell-completion redirect (e.g. MoonPay's "Send with Edge" button).
 * Carries everything needed to open the Send scene so the user can finish
 * depositing crypto for a pending sell order:
 *
 *   https://edge.app/redirect/payment/?baseCurrencyCode=btc&baseCurrencyAmount=0.001&depositWalletAddress=...&depositWalletAddressTag=...
 *
 * `currencyCode` is the provider's base currency code (resolved to a wallet at
 * handle time), `addressTag` is the destination tag / memo (required for chains
 * like XRP), and `amount` is in whole units of the base currency.
 */
export interface PaymentRedirectLink {
  type: 'paymentRedirect'
  currencyCode: string
  depositAddress: string
  amount?: string
  addressTag?: string
}

export interface EdgeLoginLink {
  type: 'edgeLogin'
  lobbyId: string
}

/**
 * Another account wants wallets from us. It published a lobby and is showing
 * `https://deep.edge.app/request-wallets/<lobbyId>`; we are the sharer, so
 * this opens the select → mode → confirm flow.
 */
export interface WalletShareRequestLink {
  type: 'walletShareRequest'
  lobbyId: string
  /** The asker's chosen nickname, from the link's `name` parameter. */
  displayName?: string
}

/**
 * Another account is offering wallets to us. It published a lobby and is
 * showing `https://deep.edge.app/share-wallets/<lobbyId>`; we are the
 * receiver, so this opens the accept flow.
 */
export interface WalletShareOfferLink {
  type: 'walletShareOffer'
  lobbyId: string
  /** The offerer's chosen nickname, from the link's `name` parameter. */
  displayName?: string
}

export interface PasswordRecoveryLink {
  type: 'passwordRecovery'
  passwordRecoveryKey: string
}

export interface PluginLink {
  type: 'plugin'
  pluginId: string
  path: string
  query: Record<string, string | null>
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
  query: Record<string, string | null>
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

/**
 * A link-scoped entry into the ramps buy/sell flow:
 *
 *   edge://buy[/<providerId>[/<paymentType>]]
 *   edge://sell[/<providerId>[/<paymentType>]]
 *
 * `providerId` and `paymentType` pin a ramp provider and payment method to the
 * top of the quote results for this navigation only; they are never written to
 * the account referral state. A pin that matches no quote degrades to the
 * normal ordering. The `?af=` query on the `https://deep.edge.app` form keeps
 * its existing attribution behavior, independent of the pinning.
 */
export interface RampCreateLink {
  type: 'rampCreate'
  direction: FiatDirection
  providerId?: string
  paymentType?: FiatPaymentType
}

export interface MarketingLink {
  type: 'marketing'
  campaignId: string // Correlates notification opens to a marketing campaign
  link?: DeepLink // Optional navigation target parsed from the payload URL
}

/**
 * A provider return link (e.g. Simplex or Paybis sending the user back into the
 * app once their session finishes). Handled by the ramp deeplink manager, not
 * by scene navigation.
 */
export interface RampLink {
  type: 'ramp'
  direction: FiatDirection
  providerId: string
  path: string
  query: Record<string, string | null>
  uri: string
}

export interface RewardsLink {
  type: 'rewards'
  pluginId: string
  tokenId: EdgeTokenId
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

export interface AffiliateLink {
  type: 'affiliate'
  installerId: string
  link: DeepLink
}

export type DeepLink =
  | AffiliateLink
  | AztecoLink
  | SceneLink
  | EdgeLoginLink
  | FiatPluginLink
  | FiatProviderLink
  | MarketingLink
  | ModalLink
  | NoopLink
  | PasswordRecoveryLink
  | PaymentProtoLink
  | PaymentRedirectLink
  | PluginLink
  | PriceChangeLink
  | PromotionLink
  | RequestAddressLink
  | SwapLink
  | WalletConnectLink
  | RampCreateLink
  | RampLink
  | RewardsLink
  | WalletShareOfferLink
  | WalletShareRequestLink
  | {
      type: 'other'
      protocol: string // Without the ':'
      uri: string
    }
