import type {
  EdgeAccount,
  EdgeCurrencyWallet,
  EdgePluginMap,
  EdgeSwapRequest,
  EdgeSwapRequestOptions,
  EdgeTransaction
} from 'edge-core-js'

/**
 * The swap provider that powers both Stealth flows.
 *
 * It is named once because two rules depend on it: the request restriction
 * that keeps a stealth quote on this provider alone, and the
 * transaction-details redaction that must fail CLOSED when the flow stamp did
 * not persist. A provider-routed swap is privacy-routed by construction, so
 * the pluginId is the durable half of that test.
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
 * Whether a broadcast swap-send also produced a parent-currency network-fee
 * row. A token send pays its fee in the chain's own coin, so the swap plugin
 * files a second action under `tokenId: null` alongside the token's.
 *
 * This mirrors the condition `makeSwapPluginQuote` writes that row under, and
 * exists so the caller stamps a row the plugin really created rather than
 * inventing a parent-currency entry for a mainnet send that has none. The
 * plugin reads the deprecated `parentNetworkFee`, whose upgraded form is a
 * `tokenId: null` entry in `networkFees` beside the token's own.
 */
export function hasParentFeeRow(tx: EdgeTransaction): boolean {
  return (
    tx.tokenId != null &&
    tx.networkFees.some(networkFee => networkFee.tokenId == null)
  )
}

/**
 * The destination wallet of a wallet-to-wallet swap request.
 *
 * `EdgeSwapRequest.toWallet` became optional when swap-to-address arrived, but
 * only that flow omits it and that flow has its own scenes, so every
 * wallet-to-wallet surface needs the same narrowing before it can read the
 * destination. Six copies of this guard had already drifted into two different
 * messages; one helper keeps the narrowing, the message and the reason for
 * both in one place.
 */
export function requireDestinationWallet(
  request: EdgeSwapRequest
): EdgeCurrencyWallet {
  const { toWallet } = request
  if (toWallet == null) {
    throw new Error('Swap request is missing a destination wallet')
  }
  return toWallet
}
