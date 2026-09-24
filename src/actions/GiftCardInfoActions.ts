import { asMaybe, asObject } from 'cleaners'

import type { ThunkAction } from '../types/reduxTypes'
import { infoServerData } from '../util/network'
import {
  asNestedDisableMap,
  type NestedDisableMap
} from './ExchangeInfoActions'

// Remote enable/disable config for gift card providers, served by the info
// server as `giftCardInfo`. `disablePlugins` is a generic NestedDisableMap
// keyed by providerId, so it works for any present or future provider:
//   { phaze: true }              // disable the entire provider
//   { phaze: { '12345': true } } // disable a single brand by productId
//   { bitrefill: true }          // webview provider: whole-provider only
export const asGiftCardInfo = asObject({
  disablePlugins: asMaybe(asNestedDisableMap, () => ({}))
})

// Provider IDs used as keys in the info-server giftCardInfo.disablePlugins map.
// Phaze supports per-brand granularity (keyed by productId); Bitrefill is a
// webview, so only whole-provider disabling applies.
export const PHAZE_PLUGIN_ID = 'phaze'
export const BITREFILL_PLUGIN_ID = 'bitrefill'

export type GiftCardInfo = ReturnType<typeof asGiftCardInfo>

export function updateGiftCardInfo(): ThunkAction<Promise<void>> {
  return async dispatch => {
    try {
      // Read `giftCardInfo` from the RAW rollup, not the cleaned one:
      // `asInfoRollup` in edge-info-server 3.12.0 has no such key and drops it,
      // so the cleaned rollup reports every provider enabled no matter what the
      // info server serves. 3.13.0 does define the field, but it also exports an
      // attestation module that pulls `jose`'s node build, which Metro cannot
      // resolve, so the bump is blocked. This cleaner is ours, so parsing the
      // raw payload here needs neither.
      const rollup = infoServerData.rollupRaw as
        | { giftCardInfo?: unknown }
        | undefined
      const data = asGiftCardInfo(rollup?.giftCardInfo ?? {})
      dispatch({ type: 'UPDATE_GIFT_CARD_INFO', data })
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e)
      console.warn(`Failed to get info server giftCardInfo: ${message}`)
    }
  }
}

/** True when the entire provider is remotely disabled. */
export const isGiftCardProviderDisabled = (
  disablePlugins: NestedDisableMap,
  pluginId: string
): boolean => disablePlugins[pluginId] === true

/**
 * True when a specific brand within a provider is remotely disabled — either
 * because the whole provider is disabled, or because the brand is listed
 * individually.
 */
export const isGiftCardBrandDisabled = (
  disablePlugins: NestedDisableMap,
  pluginId: string,
  brandId: string
): boolean => {
  const providerNode = disablePlugins[pluginId]
  if (providerNode === true) return true
  if (providerNode == null) return false
  return providerNode[brandId] === true
}
