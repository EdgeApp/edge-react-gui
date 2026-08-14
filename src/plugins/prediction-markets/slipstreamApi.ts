import { asJSON } from 'cleaners'

import { ENV } from '../../env'
import { debugLog } from '../../util/logger'
import { predictionMarketSampleData } from './slipstreamSampleData'
import {
  asPredictionMarkets,
  type PredictionMarket,
  type PredictionMarketCategory
} from './slipstreamTypes'

const DEFAULT_BASE_URL = 'https://api.papi.market'

export interface PredictionMarketsResult {
  markets: PredictionMarket[]
  /** True when the bundled sample dataset is shown (no API key configured). */
  isSampleData: boolean
}

interface SlipstreamConfig {
  apiKey: string
  baseUrl: string
}

const getSlipstreamConfig = (): SlipstreamConfig | undefined => {
  const config = ENV.PLUGIN_API_KEYS?.slipstream
  if (config?.apiKey == null || config.apiKey === '') return undefined
  return { apiKey: config.apiKey, baseUrl: config.baseUrl ?? DEFAULT_BASE_URL }
}

/**
 * Fetches the matched markets for one category from the Slipstream Connect
 * API. Falls back to the bundled sample dataset when no API key is
 * configured; live fetch errors are thrown for the caller's error state.
 */
export const fetchPredictionMarkets = async (
  category: PredictionMarketCategory
): Promise<PredictionMarketsResult> => {
  const config = getSlipstreamConfig()
  if (config == null) {
    debugLog(
      'predictionMarkets',
      'No Slipstream Connect API key configured; using sample data'
    )
    return {
      markets: predictionMarketSampleData[category],
      isSampleData: true
    }
  }

  const uri = `${config.baseUrl}/connect/markets/${category}`
  debugLog('predictionMarkets', 'Fetching', uri)
  const response = await fetch(uri, {
    headers: { 'X-API-Key': config.apiKey }
  })
  if (!response.ok) {
    throw new Error(
      `Slipstream markets/${category} failed: HTTP ${response.status}`
    )
  }
  const text = await response.text()
  return { markets: asJSON(asPredictionMarkets)(text), isSampleData: false }
}
