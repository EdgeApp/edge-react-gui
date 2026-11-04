import type {
  EdgeSwapPluginType,
  EdgeSwapRequest,
  EdgeSwapRequestOptions
} from 'edge-core-js'

import {
  type DisableAssetsByPlugin,
  type DisablePluginMap,
  getDisabledSwapPlugins
} from '../actions/ExchangeInfoActions'
import type { AccountReferral } from '../types/ReferralTypes'
import type { PluginTweak } from '../types/TweakTypes'
import { bestOfPlugins, type TweakSource } from './ReferralHelpers'

/**
 * The swap request options for an account, as the app and the CLI both ask.
 *
 * One builder, so the app's swap scenes and the CLI's `fetch-swap-quotes`
 * cannot drift: both turn off the providers Edge disabled on the info server
 * and the ones the account's referral or a promotion disables, prefer the same
 * provider, pass the same promo codes and wait as long.
 *
 * Node-safe: no react-native, no Redux.
 */
export function makeSwapRequestOptions(opts: {
  /** The referral cache's account plugin tweaks. */
  accountPlugins: PluginTweak[]
  accountReferral: AccountReferral
  /** `Settings.json`'s `preferredSwapPluginId`. */
  preferredSwapPluginId: string | undefined
  /** `Settings.json`'s `preferredSwapPluginType`. */
  preferredSwapPluginType: EdgeSwapPluginType | undefined
  /** The info server's `exchangeInfo.swap.disablePlugins`. */
  disablePlugins: DisablePluginMap
}): { options: EdgeSwapRequestOptions; swapSource: TweakSource } {
  const activePlugins = bestOfPlugins(
    opts.accountPlugins,
    opts.accountReferral,
    opts.preferredSwapPluginId
  )
  return {
    options: {
      disabled: { ...activePlugins.disabled, ...opts.disablePlugins },
      noResponseMs: 60 * 1000,
      preferPluginId: activePlugins.preferredSwapPluginId,
      preferType: opts.preferredSwapPluginType,
      promoCodes: activePlugins.promoCodes,
      slowResponseMs: 10 * 1000
    },
    swapSource: activePlugins.swapSource
  }
}

/**
 * The options for one request: the account's, plus the providers Edge turned
 * off for this request's source or destination asset.
 */
export function withAssetDisabledPlugins(
  options: EdgeSwapRequestOptions,
  disableAssetsByPlugin: DisableAssetsByPlugin,
  request: EdgeSwapRequest
): EdgeSwapRequestOptions {
  return {
    ...options,
    disabled: {
      ...options.disabled,
      ...getDisabledSwapPlugins(disableAssetsByPlugin, request)
    }
  }
}
