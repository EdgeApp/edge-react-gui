import { EDGE_CONTENT_SERVER_URI } from '../../../constants/CdnConstants'
import type {
  RampCheckSupportRequest,
  RampPlugin,
  RampPluginConfig,
  RampPluginFactory,
  RampQuoteRequest,
  RampQuoteResult,
  RampSupportResult
} from '../rampPluginTypes'
import type { InfiniteApiConfig } from './infiniteApi'
import { asInitOptions } from './infiniteRampTypes'

const pluginId = 'infinite'
const partnerIcon = `${EDGE_CONTENT_SERVER_URI}/infinite.png`
const pluginDisplayName = 'Infinite'

// Provider configuration cache
interface ProviderConfigCache {
  data: {
    supportedRegions: string[]
    supportedFiats: string[]
    supportedCryptos: any[]
  } | null
  timestamp: number
}

const CACHE_TTL_MS = 2 * 60 * 1000 // 2 minutes
let configCache: ProviderConfigCache = {
  data: null,
  timestamp: 0
}

export const infiniteRampPlugin: RampPluginFactory = (
  config: RampPluginConfig
): RampPlugin => {
  const { apiKey, apiUrl, orgId } = asInitOptions(config.initOptions)
  // Destructure config items that will be used in future implementation
  // const { account, navigation, onLogEvent, disklet } = config

  const apiConfig: InfiniteApiConfig = { apiKey, apiUrl, orgId }

  // Internal function to fetch provider configuration with caching
  const fetchProviderConfig = async (): Promise<{
    supportedRegions: string[]
    supportedFiats: string[]
    supportedCryptos: any[]
  }> => {
    const now = Date.now()

    // Check if cache is valid
    if (
      configCache.data != null &&
      now - configCache.timestamp < CACHE_TTL_MS
    ) {
      return configCache.data
    }

    // TODO: Fetch fresh configuration from API using apiConfig
    // For now, return empty config
    console.log('Will use apiConfig for API calls:', apiConfig)
    const newConfig = {
      supportedRegions: [],
      supportedFiats: [],
      supportedCryptos: []
    }

    // Update cache
    configCache = {
      data: newConfig,
      timestamp: now
    }

    return newConfig
  }

  const plugin: RampPlugin = {
    pluginId,
    rampInfo: {
      partnerIcon,
      pluginDisplayName
    },

    checkSupport: async (
      request: RampCheckSupportRequest
    ): Promise<RampSupportResult> => {
      try {
        // TODO: Implement actual support checking logic
        console.log('Infinite checkSupport called with:', request)

        // For now, return false for all requests
        return { supported: false }
      } catch (error) {
        console.error('Infinite: Error in checkSupport:', error)
        return { supported: false }
      }
    },

    fetchQuote: async (
      request: RampQuoteRequest
    ): Promise<RampQuoteResult[]> => {
      try {
        // TODO: Implement actual quote fetching logic
        console.log('Infinite fetchQuote called with:', request)

        // Fetch provider configuration (cached or fresh)
        const config = await fetchProviderConfig()
        console.log('Provider config:', config)

        // For now, return empty array
        return []
      } catch (error) {
        console.error('Infinite: Error in fetchQuote:', error)
        // Return empty array for any errors
        return []
      }
    }
  }

  return plugin
}
