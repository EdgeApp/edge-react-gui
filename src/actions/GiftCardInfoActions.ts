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
      const data = asGiftCardInfo(infoServerData.rollup?.giftCardInfo ?? {})
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
