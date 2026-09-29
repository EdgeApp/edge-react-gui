import {
  asArray,
  asEither,
  asMaybe,
  asObject,
  asOptional,
  asString,
  asValue,
  type Cleaner
} from 'cleaners'
import type { EdgePluginMap, EdgeSwapRequest, EdgeTokenId } from 'edge-core-js'

import type { ThunkAction } from '../types/reduxTypes'
import { infoServerData } from '../util/network'

const asDisableAsset = asObject({
  pluginId: asString,

  // tokenId = undefined will only disable the mainnet coin
  // tokenId = 'allTokens' will disable all tokens
  // tokenId = 'allCoins' will disable all tokens and mainnet coin
  tokenId: asOptional(asString) // May also be 'all' to disable all tokens
})

const asTrue = asValue<[true]>(true)
const asDisablePluginsMap = asObject(asTrue)
export type DisablePluginMap = ReturnType<typeof asDisablePluginsMap>

export interface NestedDisableMap {
  [pluginId: string]: true | NestedDisableMap
}
export const asNestedDisableMap: Cleaner<NestedDisableMap> = asObject(
  asEither(asTrue, raw => asNestedDisableMap(raw))
)

const asFiatDirectionInfo = asObject({
  disablePlugins: asNestedDisableMap
})
type FiatDirectionInfo = ReturnType<typeof asFiatDirectionInfo>

export const asExchangeInfo = asObject({
  buy: asMaybe<FiatDirectionInfo>(asFiatDirectionInfo, () => ({
    disablePlugins: {}
  })),
  sell: asMaybe<FiatDirectionInfo>(asFiatDirectionInfo, () => ({
    disablePlugins: {}
  })),
  swap: asMaybe(
    asObject({
      disableAssets: asMaybe(
        asObject({
          source: asArray(asDisableAsset),
          destination: asArray(asDisableAsset)
        }),
        () => ({ source: [], destination: [] })
      ),
      // Same shape as disableAssets, keyed by swap pluginId. A match only
      // removes that one swap provider from the quote request.
      disableAssetsByPlugin: asMaybe(
        asObject(
          asObject({
            source: asArray(asDisableAsset),
            destination: asArray(asDisableAsset)
          })
        ),
        () => ({})
      ),
      disablePlugins: asMaybe(asDisablePluginsMap, () => ({}))
    }),
    () => ({
      disableAssets: { source: [], destination: [] },
      disableAssetsByPlugin: {},
      disablePlugins: {}
    })
  )
})

export type DisableAsset = ReturnType<typeof asDisableAsset>
export type ExchangeInfo = ReturnType<typeof asExchangeInfo>
export type DisableAssetsByPlugin =
  ExchangeInfo['swap']['disableAssetsByPlugin']

/**
 * True when the asset matches any entry in a disableAssets list.
 * An entry without a tokenId matches the mainnet coin, whose tokenId is null.
 */
export const isAssetDisabled = (
  disableAssets: DisableAsset[],
  pluginId: string,
  tokenId: EdgeTokenId
): boolean => {
  for (const disableAsset of disableAssets) {
    if (disableAsset.pluginId !== pluginId) continue
    if (disableAsset.tokenId === 'allCoins') return true
    if (disableAsset.tokenId === 'allTokens' && tokenId != null) return true
    if ((disableAsset.tokenId ?? null) === tokenId) return true
  }
  return false
}

/**
 * Returns the swap plugins whose disableAssetsByPlugin entry bans the
 * request's source or destination asset.
 */
export const getDisabledSwapPlugins = (
  disableAssetsByPlugin: DisableAssetsByPlugin,
  request: EdgeSwapRequest
): EdgePluginMap<true> => {
  const out: EdgePluginMap<true> = {}
  for (const swapPluginId of Object.keys(disableAssetsByPlugin)) {
    const { source, destination } = disableAssetsByPlugin[swapPluginId]
    if (
      isAssetDisabled(
        source,
        request.fromWallet.currencyInfo.pluginId,
        request.fromTokenId
      ) ||
      isAssetDisabled(
        destination,
        request.toWallet.currencyInfo.pluginId,
        request.toTokenId
      )
    ) {
      out[swapPluginId] = true
    }
  }
  return out
}

export function updateExchangeInfo(): ThunkAction<Promise<void>> {
  return async (dispatch, getState) => {
    try {
      // Read `exchangeInfo` from the RAW rollup, not the cleaned one:
      // `asInfoRollup` in edge-info-server 3.12.0 has no
      // `swap.disableAssetsByPlugin` key and drops it. This cleaner is ours,
      // so parsing the raw payload keeps the field without a package bump.
      const rollup = infoServerData.rollupRaw as
        | { exchangeInfo?: unknown }
        | undefined
      const data = asExchangeInfo(rollup?.exchangeInfo)
      dispatch({ type: 'UPDATE_EXCHANGE_INFO', data })
    } catch (e: any) {
      console.warn(`Failed to get info server exchangeInfo: ${e.message}`)
    }
  }
}
