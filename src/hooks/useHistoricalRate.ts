import { EdgeFetchFunction } from 'edge-core-js'

import { getHistoricalRate } from '../util/exchangeRates'
import { useAsyncValue } from './useAsyncValue'

export const useHistoricalRate = (codePair: string, date: string, maxQuerySize?: number, doFetch?: EdgeFetchFunction) => {
  const [historicalRate = 0] = useAsyncValue(async (): Promise<number> => {
    return await getHistoricalRate(codePair, date, maxQuerySize, doFetch)
  }, [codePair, date, maxQuerySize, doFetch])

  return historicalRate
}
