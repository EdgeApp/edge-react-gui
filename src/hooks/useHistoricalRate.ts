import type { EdgeFetchFunction, EdgeTokenId } from 'edge-core-js'

import { getHistoricalCryptoRate } from '../util/exchangeRates'
import { useAsyncValue } from './useAsyncValue'

export const useHistoricalRate = (
  pluginId: string,
  tokenId: EdgeTokenId,
  targetFiat: string,
  date: string,
  maxQuerySize?: number,
  doFetch?: EdgeFetchFunction
) => {
  const [historicalRate = 0] = useAsyncValue(async (): Promise<number> => {
    return await getHistoricalCryptoRate(
      pluginId,
      tokenId,
      targetFiat,
      date,
      maxQuerySize,
      doFetch
    )
  }, [pluginId, tokenId, targetFiat, date, maxQuerySize, doFetch])

  return historicalRate
}
