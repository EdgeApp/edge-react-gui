import { asArray, asEither, asMaybe, asObject, asOptional, asString, asValue, Cleaner } from 'cleaners'

import { ThunkAction } from '../types/reduxTypes'
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
const asNestedDisableMap: Cleaner<NestedDisableMap> = asObject(asEither(asTrue, raw => asNestedDisableMap(raw)))

const asFiatDirectionInfo = asObject({
  disablePlugins: asNestedDisableMap
})
type FiatDirectionInfo = ReturnType<typeof asFiatDirectionInfo>

export const asExchangeInfo = asObject({
  buy: asMaybe<FiatDirectionInfo>(asFiatDirectionInfo, () => ({ disablePlugins: {} })),
  sell: asMaybe<FiatDirectionInfo>(asFiatDirectionInfo, () => ({ disablePlugins: {} })),
  swap: asMaybe(
    asObject({
      disableAssets: asMaybe(
        asObject({
          source: asArray(asDisableAsset),
          destination: asArray(asDisableAsset)
        }),
        () => ({ source: [], destination: [] })
      ),
      disablePlugins: asMaybe(asDisablePluginsMap, () => ({}))
    }),
    () => ({
      disableAssets: { source: [], destination: [] },
      disablePlugins: {}
    })
  )
})

export type DisableAsset = ReturnType<typeof asDisableAsset>
export type ExchangeInfo = ReturnType<typeof asExchangeInfo>

export function updateExchangeInfo(): ThunkAction<Promise<void>> {
  return async (dispatch, getState) => {
    try {
      const data = asExchangeInfo(infoServerData.rollup?.exchangeInfo)
      dispatch({ type: 'UPDATE_EXCHANGE_INFO', data })
    } catch (e: any) {
      console.warn(`Failed to get info server exchangeInfo: ${e.message}`)
    }
  }
}
