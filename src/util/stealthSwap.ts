import type {
  EdgeAccount,
  EdgePluginMap,
  EdgeSwapRequestOptions,
  EdgeTokenId
} from 'edge-core-js'

import type { DisableAsset } from '../actions/ExchangeInfoActions'

/**
 * The swap provider that powers both Stealth flows, and every send-to-address
 * quote with them. Named once so the request restriction below and the send
 * scene's terms modal agree on it.
 */
export const STEALTH_SWAP_PLUGIN_ID = 'houdini'

interface StealthSwapFlags {
  /**
   * Query Houdini even when the user switched it off in their exchange
   * settings. That setting governs which providers the swap aggregator may
   * use, so it is the user's answer about swapping, not about sending: a send
   * feature that happens to be powered by Houdini must not disappear because a
   * swap provider was turned off. Set on the send scene only; the Exchange
   * scene keeps honoring the setting.
   */
  ignoreProviderSetting?: boolean
}

/**
 * Restricts a swap request to the Houdini privacy provider, for Stealth Swap
 * and Stealth Send. Every other enabled swap provider is disabled for the
 * request, and any preferred-provider override is cleared so it cannot fight
 * the restriction.
 */
export function makeStealthSwapRequestOptions(
  account: EdgeAccount,
  opts: EdgeSwapRequestOptions = {},
  flags: StealthSwapFlags = {}
): EdgeSwapRequestOptions {
  const disabled: EdgePluginMap<true> = { ...opts.disabled }
  for (const swapPluginId of Object.keys(account.swapConfig)) {
    if (swapPluginId !== STEALTH_SWAP_PLUGIN_ID) disabled[swapPluginId] = true
  }
  return {
    ...opts,
    disabled,
    forceEnabled:
      flags.ignoreProviderSetting === true
        ? { ...opts.forceEnabled, [STEALTH_SWAP_PLUGIN_ID]: true }
        : opts.forceEnabled,
    preferPluginId: undefined,
    preferType: undefined
  }
}

/**
 * Whether the info server's swap kill switch covers an asset. Each entry names
 * a chain plus one token, no token for the chain's own coin, `allTokens` for
 * every token, or `allCoins` for everything on the chain.
 */
export function disableAssetsCover(
  disableAssets: DisableAsset[],
  pluginId: string,
  tokenId: EdgeTokenId
): boolean {
  return disableAssets.some(
    disableAsset =>
      disableAsset.pluginId === pluginId &&
      ((disableAsset.tokenId ?? null) === tokenId ||
        disableAsset.tokenId === 'allCoins' ||
        (disableAsset.tokenId === 'allTokens' && tokenId != null))
  )
}
