import { useQuery } from '@tanstack/react-query'
import type { EdgeCurrencyWallet, EdgeTokenId } from 'edge-core-js'
import * as React from 'react'

import type { FiatPluginRegionCode } from '../plugins/gui/fiatPluginTypes'
import type {
  RampCheckSupportRequest,
  RampPlugin,
  RampSupportResult
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

export interface SupportedPluginResult {
  plugin: RampPlugin
  supportResult: RampSupportResult
}

interface UseSupportedPluginsResult {
  supportedPlugins: SupportedPluginResult[]
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
  const pluginSignature = React.useMemo(() => {
    const ids = Object.values(plugins)
      .map(p => p.pluginId)
      .sort()
    return ids.join('|') // stable across renders if the set is the same
  }, [plugins])

  const queryKey = [
    'supportedPlugins',
    selectedCrypto?.pluginId,
    selectedCrypto?.tokenId,
    selectedFiatCurrencyCode,
    regionCode,
    direction,
    pluginSignature
  ]

  const {
    data: supportedPlugins = [],
    isLoading,
    error
  } = useQuery<SupportedPluginResult[]>({
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
            const supportResult = await plugin.checkSupport(checkSupportRequest)
            return {
              plugin,
              supportResult
            }
          } catch (error) {
            console.warn(
              `Failed to check support for plugin ${plugin.pluginId}:`,
              error
            )
            return {
              plugin,
              supportResult: { supported: false }
            }
          }
        })
      )

      // Filter only supported plugins
      return supportChecks.filter(check => check.supportResult.supported)
    },
    enabled:
      selectedWallet != null &&
      selectedCrypto != null &&
      selectedFiatCurrencyCode != null &&
      regionCode != null
  })

  return {
    supportedPlugins,
    isLoading,
    error
  }
}
