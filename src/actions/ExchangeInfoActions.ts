import {
  asArray,
  asDate,
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
  disablePlugins: asNestedDisableMap,
  // Payment types to badge as "New" until `endIsoDate`. Each entry is cleaned on
  // its own: a malformed one badges nothing and leaves everything else in place,
  // `disablePlugins` included.
  newPaymentTypes: asMaybe(
    asObject(asMaybe(asObject({ endIsoDate: asDate }))),
    () => ({})
  )
})
type FiatDirectionInfo = ReturnType<typeof asFiatDirectionInfo>

export const asExchangeInfo = asObject({
  buy: asMaybe<FiatDirectionInfo>(asFiatDirectionInfo, () => ({
    disablePlugins: {},
    newPaymentTypes: {}
  })),
  sell: asMaybe<FiatDirectionInfo>(asFiatDirectionInfo, () => ({
    disablePlugins: {},
    newPaymentTypes: {}
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
      // removes that one swap provider from the quote request. Each provider
      // entry is cleaned on its own, so a malformed entry bans nothing and
      // leaves the other providers' bans in place.
      disableAssetsByPlugin: asMaybe(
        asObject(
          asMaybe(
            asObject({
              source: asArray(asDisableAsset),
              destination: asArray(asDisableAsset)
            }),
            () => ({ source: [], destination: [] })
          )
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

/**
 * True while the info server lists the payment type as new. The badge follows
 * the payment type across providers, and the date check expires it with no app
 * or server change.
 */
export const isPaymentTypeNew = (
  newPaymentTypes: FiatDirectionInfo['newPaymentTypes'],
  paymentType: string,
  now: Date
): boolean => {
  const entry = newPaymentTypes[paymentType]
  return entry != null && now.valueOf() < entry.endIsoDate.valueOf()
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
      // This runs on every rollup, and the Send scene re-quotes when these
      // objects change identity, so an identical payload must not replace
      // them. JSON rather than `matchJson`, which sees all Dates as equal:
      const unchanged =
        JSON.stringify(data) === JSON.stringify(getState().ui.exchangeInfo)
      if (unchanged) return
      dispatch({ type: 'UPDATE_EXCHANGE_INFO', data })
    } catch (e: any) {
      console.warn(`Failed to get info server exchangeInfo: ${e.message}`)
    }
  }
}
