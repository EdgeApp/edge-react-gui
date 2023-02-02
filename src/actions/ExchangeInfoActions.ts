import { asArray, asEither, asMaybe, asObject, asOptional, asString, asValue, Cleaner } from 'cleaners'

import { config } from '../theme/appConfig'
import { ThunkAction } from '../types/reduxTypes'
import { fetchInfo } from '../util/network'

const asDisableAsset = asObject({
  pluginId: asString,

  // tokenId = undefined will only disable the mainnet coin
  // tokenId = 'allTokens' will disable all tokens
  // tokenId = 'allCoins' will disable all tokens and mainnet coin
  tokenId: asOptional(asString) // May also be 'all' to disable all tokens
})

const asDisablePluginsMap = asMaybe(asObject(asValue(true)), {})
export type DisablePluginMap = ReturnType<typeof asDisablePluginsMap>

export interface NestedPluginMap {
  [pluginId: string]: true | NestedPluginMap
}

const asNestedPlugin: Cleaner<true | NestedPluginMap> = asEither(
  raw => {
    if (raw === true) return raw
    throw new Error('Must be true')
  },
  asObject(raw => {
    if (typeof raw === 'object' && Object.keys(raw).length === 0) throw new Error('Invalid disablePlugins object')
    return asNestedPlugin(raw)
  })
)

const asNestedPluginMap = asMaybe(
  asObject({
    disablePlugins: asObject(asNestedPlugin)
  }),
  { disablePlugins: {} }
)

export const asExchangeInfo = asObject({
  buy: asNestedPluginMap,
  sell: asNestedPluginMap,
  swap: asMaybe(
    asObject({
      disableAssets: asMaybe(
        asObject({
          source: asArray(asDisableAsset),
          destination: asArray(asDisableAsset)
        }),
        { source: [], destination: [] }
      ),
      disablePlugins: asDisablePluginsMap
    }),
    { disableAssets: { source: [], destination: [] }, disablePlugins: {} }
  )
})

export type DisableAsset = ReturnType<typeof asDisableAsset>
export type ExchangeInfo = ReturnType<typeof asExchangeInfo>

export function updateExchangeInfo(): ThunkAction<Promise<void>> {
  return async (dispatch, getState) => {
    try {
      const reply = await fetchInfo(`v1/exchangeInfo/${config.appId ?? 'edge'}`)
      if (!reply.ok) {
        const text = await reply.text()
        throw new Error(`updateExchangeInfo returned error ${text}`)
      }
      const clean = asExchangeInfo(await reply.json())
      dispatch({ type: 'UPDATE_EXCHANGE_INFO', data: clean })
    } catch (e: any) {
      console.warn(`Failed to contact info server: ${e.message}`)
    }
  }
}
