import { asArray, asObject, asOptional, asString } from 'cleaners'

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

export const asExchangeInfo = asObject({
  swap: asObject({
    disableAssets: asObject({
      source: asArray(asDisableAsset),
      destination: asArray(asDisableAsset)
    })
  })
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
