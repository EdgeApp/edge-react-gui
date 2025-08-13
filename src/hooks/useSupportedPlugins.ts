import { useQuery, type UseQueryResult } from '@tanstack/react-query'
import type { EdgeCurrencyWallet } from 'edge-core-js'

import type { WalletListWalletResult } from '../components/modals/WalletListModal'
import type { FiatPaymentType } from '../plugins/gui/fiatPluginTypes'
import type {
  RampPlugin,
  RampSupportedAssetsRequest
} from '../plugins/ramps/rampPluginTypes'
import { useSelector } from '../types/reactRedux'

interface UseSupportedPluginsParams {
  selectedWallet: EdgeCurrencyWallet | undefined
  selectedCrypto: WalletListWalletResult | undefined
  selectedCryptoCurrencyCode: string | undefined
  selectedFiatCurrencyCode: string
  countryCode: string
  stateProvinceCode?: string
}

export const useSupportedPlugins = ({
  selectedWallet,
  selectedCrypto,
  selectedCryptoCurrencyCode,
  selectedFiatCurrencyCode,
  countryCode,
  stateProvinceCode
}: UseSupportedPluginsParams): UseQueryResult<Record<string, RampPlugin>> => {
  const rampPlugins = useSelector(state => state.rampPlugins.plugins)

  // Get all possible payment types
  const allPaymentTypes: FiatPaymentType[] = [
    'ach',
    'applepay',
    'colombiabank',
    'credit',
    'directtobank',
    'fasterpayments',
    'googlepay',
    'iach',
    'ideal',
    'interac',
    'iobank',
    'mexicobank',
    'payid',
    'paypal',
    'pix',
    'pse',
    'revolut',
    'sepa',
    'spei',
    'turkishbank',
    'venmo',
    'wire'
  ]

  return useQuery({
    queryKey: [
      'supportedRampPlugins',
      selectedWallet?.id,
      selectedCrypto?.tokenId,
      selectedFiatCurrencyCode,
      countryCode,
      stateProvinceCode
    ],
    queryFn: async (): Promise<Record<string, RampPlugin>> => {
      if (!selectedWallet || !selectedCryptoCurrencyCode || !selectedCrypto) {
        return {}
      }

      const supportRequest: RampSupportedAssetsRequest = {
        direction: 'buy',
        paymentTypes: allPaymentTypes,
        regionCode: {
          countryCode: countryCode || 'US',
          stateProvinceCode
        }
      }

      // Fetch support from all plugins in parallel
      const supportPromises = Object.entries(rampPlugins).map(
        async ([pluginId, plugin]) => {
          try {
            const assetMap = await plugin.getSupportedAssets(supportRequest)
            return { pluginId, plugin, assetMap }
          } catch (error) {
            console.error(
              `Failed to get supported assets for ${pluginId}:`,
              error
            )
            return { pluginId, plugin, assetMap: null }
          }
        }
      )

      const results = await Promise.all(supportPromises)

      // Filter to only supported plugins
      return results
        .filter(({ assetMap }) => {
          if (!assetMap) return false

          // Check crypto support
          const pluginCurrencyCode = selectedWallet.currencyInfo.pluginId
          const cryptoSupported = assetMap.crypto[pluginCurrencyCode]?.some(
            token => token.tokenId === (selectedCrypto.tokenId ?? null)
          )

          // Check fiat support
          const fiatSupported =
            assetMap.fiat[`iso:${selectedFiatCurrencyCode}`] === true

          return cryptoSupported && fiatSupported
        })
        .reduce<Record<string, RampPlugin>>((plugins, { plugin }) => {
          plugins[plugin.pluginId] = plugin
          return plugins
        }, {})
    },
    enabled:
      !!selectedWallet &&
      !!selectedCryptoCurrencyCode &&
      Object.keys(rampPlugins).length > 0,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    gcTime: 10 * 60 * 1000 // Keep in cache for 10 minutes
  })
}
