import { useQuery } from '@tanstack/react-query'
import type { EdgeCurrencyWallet, EdgeTokenId } from 'edge-core-js'
import * as React from 'react'

import type { FiatPluginRegionCode } from '../plugins/gui/fiatPluginTypes'
import type {
  RampCheckSupportRequest,
  RampPlugin
} from '../plugins/ramps/rampPluginTypes'

interface UseSupportedPluginsParams {
  selectedWallet?: EdgeCurrencyWallet
  selectedCrypto?: {
    pluginId: string
    tokenId: EdgeTokenId
  }
  selectedFiatCurrencyCode?: string
  countryCode?: string
  stateProvinceCode?: string
  plugins: Record<string, RampPlugin>
  direction?: 'buy' | 'sell'
}

interface UseSupportedPluginsResult {
  supportedPlugins: RampPlugin[]
  isLoading: boolean
  error: Error | null
}

export const useSupportedPlugins = ({
  selectedWallet,
  selectedCrypto,
  selectedFiatCurrencyCode,
  countryCode,
  stateProvinceCode,
  plugins,
  direction = 'buy'
}: UseSupportedPluginsParams): UseSupportedPluginsResult => {
  // Build region code
  const regionCode: FiatPluginRegionCode | undefined = React.useMemo(() => {
    if (countryCode == null) return undefined

    return {
      countryCode,
      stateProvinceCode
    }
  }, [countryCode, stateProvinceCode])

  // Create query key
  const queryKey = [
    'supportedPlugins',
    selectedCrypto?.pluginId,
    selectedCrypto?.tokenId,
    selectedFiatCurrencyCode,
    regionCode,
    direction
  ]

  const {
    data: supportedPlugins = [],
    isLoading,
    error
  } = useQuery<RampPlugin[]>({
    queryKey,
    queryFn: async () => {
      // Early return if required params are missing
      if (
        selectedCrypto == null ||
        selectedFiatCurrencyCode == null ||
        regionCode == null ||
        selectedWallet == null
      ) {
        return []
      }

      // Build check support request
      const checkSupportRequest: RampCheckSupportRequest = {
        direction,
        regionCode,
        fiatAsset: {
          currencyCode: selectedFiatCurrencyCode // Without 'iso:' prefix
        },
        cryptoAsset: {
          pluginId: selectedCrypto.pluginId,
          tokenId: selectedCrypto.tokenId
        }
      }

      // Check support for all plugins in parallel
      const supportChecks = await Promise.all(
        Object.values(plugins).map(async plugin => {
          try {
            const result = await plugin.checkSupport(checkSupportRequest)
            return {
              plugin,
              supported: result.supported
            }
          } catch (error) {
            console.warn(
              `Failed to check support for plugin ${plugin.pluginId}:`,
              error
            )
            return {
              plugin,
              supported: false
            }
          }
        })
      )

      // Filter only supported plugins
      return supportChecks
        .filter(check => check.supported)
        .map(check => check.plugin)
    },
    enabled:
      selectedWallet != null &&
      selectedCrypto != null &&
      selectedFiatCurrencyCode != null &&
      regionCode != null,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes cache time
    refetchOnWindowFocus: false
  })

  return {
    supportedPlugins,
    isLoading,
    error
  }
}
