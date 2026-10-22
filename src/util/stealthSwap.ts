import type {
  EdgeAccount,
  EdgePluginMap,
  EdgeSwapRequestOptions,
  EdgeTokenId
} from 'edge-core-js'

import type {
  DisableAsset,
  DisableAssetsByPlugin,
  ExchangeInfo
} from '../actions/ExchangeInfoActions'

type DisableAssets = ExchangeInfo['swap']['disableAssets']

/**
 * The swap provider that powers both Stealth flows, and every send-to-address
 * quote with them. Named once so the request restriction below and the send
 * scene's terms modal agree on it.
 */
export const STEALTH_SWAP_PLUGIN_ID = 'houdini'

/**
 * Where both Stealth toggles' "Learn more" sends the user: Edge's support
 * article on Stealth Send and Stealth Swap. The send scene and the swap
 * amount-entry scene both read this constant.
 */
export const STEALTH_LEARN_MORE_URI =
  'https://support.edge.app/articles/17606891'

/**
 * The Stealth provider's display name, for copy that names it. Falls back to
 * the plugin id when the account has no such provider registered.
 */
export const getStealthProviderName = (account: EdgeAccount): string =>
  account.swapConfig[STEALTH_SWAP_PLUGIN_ID]?.swapInfo.displayName ??
  STEALTH_SWAP_PLUGIN_ID

/**
 * Restricts a swap request to the Houdini privacy provider, for Stealth Swap
 * and Stealth Send. Every other enabled swap provider is disabled for the
 * request, and any preferred-provider override is cleared so it cannot fight
 * the restriction.
 *
 * Houdini is queried even when the user switched it off in their exchange
 * settings. That setting governs which providers the swap aggregator may pick
 * among for an ordinary swap. A Stealth request has no aggregation to govern:
 * the user asked for the one provider by turning Stealth on, so the feature
 * must not disappear because a swap provider was turned off. The core's
 * `disabled` still beats `forceEnabled`, so a kill switch the caller passes in
 * `opts.disabled` keeps stopping the request.
 */
export function makeStealthSwapRequestOptions(
  account: EdgeAccount,
  opts: EdgeSwapRequestOptions = {}
): EdgeSwapRequestOptions {
  const disabled: EdgePluginMap<true> = { ...opts.disabled }
  for (const swapPluginId of Object.keys(account.swapConfig)) {
    if (swapPluginId !== STEALTH_SWAP_PLUGIN_ID) disabled[swapPluginId] = true
  }
  return {
    ...opts,
    disabled,
    forceEnabled: { ...opts.forceEnabled, [STEALTH_SWAP_PLUGIN_ID]: true },
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

/**
 * The assets the info server's kill switch withdraws from a send-to-address
 * quote: the ones withdrawn from every swap, plus the ones withdrawn from the
 * stealth provider alone. That provider is the only one such a quote asks, so
 * an asset banned for it has no provider left, the same as one banned for all.
 * Bans on other providers change nothing here.
 */
export function getStealthDisableAssets(
  disableAssets: DisableAssets,
  disableAssetsByPlugin: DisableAssetsByPlugin
): DisableAssets {
  const stealthBans: DisableAssets | undefined =
    disableAssetsByPlugin[STEALTH_SWAP_PLUGIN_ID]
  if (stealthBans == null) return disableAssets
  return {
    source: [...disableAssets.source, ...stealthBans.source],
    destination: [...disableAssets.destination, ...stealthBans.destination]
  }
}
