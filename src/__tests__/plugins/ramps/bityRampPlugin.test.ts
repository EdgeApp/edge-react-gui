import { bityRampPlugin } from '../../../plugins/ramps/bity/bityRampPlugin'
import type {
  RampCheckSupportRequest,
  RampPlugin,
  RampPluginConfig,
  RampQuoteRequest
} from '../../../plugins/ramps/rampPluginTypes'

// Mock account with currency configs
const mockAccount = {
  currencyConfig: {
    ethereum: {
      currencyInfo: {
        currencyCode: 'ETH'
      },
      allTokens: {
        a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48: {
          currencyCode: 'USDC'
        },
        dac17f958d2ee523a2206206994597c13d831ec7: {
          currencyCode: 'USDT'
        }
      }
    }
  }
} as any

// Mock the config
const mockConfig: RampPluginConfig = {
  initOptions: { clientId: 'test-client-id' },
  account: mockAccount,
  navigation: {} as any,
  onLogEvent: jest.fn(),
  disklet: {} as any
}

// Mock fetch globally
global.fetch = jest.fn()

describe('Bity Ramp Plugin Implementation', () => {
  let plugin: RampPlugin

  beforeEach(() => {
    jest.clearAllMocks()
    plugin = bityRampPlugin(mockConfig)
  })

  describe('Plugin Interface', () => {
    it('should have all required properties', () => {
      expect(plugin).toHaveProperty('pluginId')
      expect(plugin).toHaveProperty('rampInfo')
      expect(plugin).toHaveProperty('checkSupport')
      expect(plugin).toHaveProperty('fetchQuote')
    })

    it('should have correct plugin metadata', () => {
      expect(plugin.pluginId).toBe('bity')
      expect(plugin.rampInfo).toEqual({
        partnerIcon: expect.stringContaining('logoBity.png'),
        pluginDisplayName: 'Bity'
      })
    })
  })

  describe('checkSupport method', () => {
    it('should return RampSupportResult type', async () => {
      const request: RampCheckSupportRequest = {
        direction: 'buy',
        regionCode: { countryCode: 'CH', stateProvinceCode: undefined },
        fiatAsset: { currencyCode: 'EUR' },
        cryptoAsset: { pluginId: 'bitcoin', tokenId: null }
      }

      const result = await plugin.checkSupport(request)

      expect(result).toHaveProperty('supported')
      expect(typeof result.supported).toBe('boolean')
    })

    it('should return false for unsupported region', async () => {
      const request: RampCheckSupportRequest = {
        direction: 'buy',
        regionCode: { countryCode: 'US', stateProvinceCode: 'CA' },
        fiatAsset: { currencyCode: 'USD' },
        cryptoAsset: { pluginId: 'bitcoin', tokenId: null }
      }

      const result = await plugin.checkSupport(request)
      expect(result).toEqual({ supported: false })
    })

    it('should return false for unsupported crypto', async () => {
      const request: RampCheckSupportRequest = {
        direction: 'buy',
        regionCode: { countryCode: 'CH', stateProvinceCode: undefined },
        fiatAsset: { currencyCode: 'EUR' },
        cryptoAsset: { pluginId: 'dogecoin', tokenId: null }
      }

      const result = await plugin.checkSupport(request)
      expect(result).toEqual({ supported: false })
    })

    it('should handle API errors gracefully', async () => {
      ;(global.fetch as jest.Mock).mockRejectedValueOnce(
        new Error('Network error')
      )

      const request: RampCheckSupportRequest = {
        direction: 'buy',
        regionCode: { countryCode: 'CH', stateProvinceCode: undefined },
        fiatAsset: { currencyCode: 'EUR' },
        cryptoAsset: { pluginId: 'bitcoin', tokenId: null }
      }

      const result = await plugin.checkSupport(request)
      expect(result).toEqual({ supported: false })
    })
  })

  describe('fetchQuote method', () => {
    it('should return empty array for unsupported requests', async () => {
      const request: RampQuoteRequest = {
        direction: 'buy',
        regionCode: { countryCode: 'US', stateProvinceCode: 'CA' },
        fiatCurrencyCode: 'iso:USD',
        exchangeAmount: '100',
        amountType: 'fiat',
        displayCurrencyCode: 'BTC',
        pluginId: 'bitcoin',
        tokenId: null,
        pluginUtils: {} as any
      }

      const quotes = await plugin.fetchQuote(request)
      expect(quotes).toEqual([])
    })

    it('should return empty array on API errors', async () => {
      ;(global.fetch as jest.Mock).mockRejectedValueOnce(
        new Error('Network error')
      )

      const request: RampQuoteRequest = {
        direction: 'buy',
        regionCode: { countryCode: 'CH', stateProvinceCode: undefined },
        fiatCurrencyCode: 'iso:EUR',
        exchangeAmount: '100',
        amountType: 'fiat',
        displayCurrencyCode: 'BTC',
        pluginId: 'bitcoin',
        tokenId: null,
        pluginUtils: {} as any
      }

      const quotes = await plugin.fetchQuote(request)
      expect(quotes).toEqual([])
    })
  })

  describe('Shared validation logic', () => {
    it('should use consistent region validation', async () => {
      const unsupportedRegion = {
        countryCode: 'JP',
        stateProvinceCode: undefined
      }

      // Test checkSupport
      const supportResult = await plugin.checkSupport({
        direction: 'buy',
        regionCode: unsupportedRegion,
        fiatAsset: { currencyCode: 'EUR' },
        cryptoAsset: { pluginId: 'bitcoin', tokenId: null }
      })
      expect(supportResult.supported).toBe(false)

      // Test fetchQuote
      const quotes = await plugin.fetchQuote({
        direction: 'buy',
        regionCode: unsupportedRegion,
        fiatCurrencyCode: 'iso:EUR',
        exchangeAmount: '100',
        amountType: 'fiat',
        displayCurrencyCode: 'BTC',
        pluginId: 'bitcoin',
        tokenId: null,
        pluginUtils: {} as any
      })
      expect(quotes).toEqual([])
    })

    it('should use consistent crypto validation', async () => {
      const unsupportedCrypto = { pluginId: 'dogecoin', tokenId: null }
      const supportedRegion = {
        countryCode: 'CH',
        stateProvinceCode: undefined
      }

      // Test checkSupport
      const supportResult = await plugin.checkSupport({
        direction: 'buy',
        regionCode: supportedRegion,
        fiatAsset: { currencyCode: 'EUR' },
        cryptoAsset: unsupportedCrypto
      })
      expect(supportResult.supported).toBe(false)

      // Test fetchQuote
      const quotes = await plugin.fetchQuote({
        direction: 'buy',
        regionCode: supportedRegion,
        fiatCurrencyCode: 'iso:EUR',
        exchangeAmount: '100',
        amountType: 'fiat',
        displayCurrencyCode: 'DOGE',
        pluginId: unsupportedCrypto.pluginId,
        tokenId: unsupportedCrypto.tokenId,
        pluginUtils: {} as any
      })
      expect(quotes).toEqual([])
    })
  })
})

// Example usage demonstrating how checkSupport would be used
describe('Dynamic Token ID Resolution', () => {
  it('should work with token IDs from account currency config', async () => {
    const plugin = bityRampPlugin(mockConfig)

    // Mock successful API response with USDC
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        currencies: [
          {
            tags: ['fiat'],
            code: 'EUR',
            max_digits_in_decimal_part: 2
          },
          {
            tags: ['crypto', 'ethereum', 'erc20'],
            code: 'USDC',
            max_digits_in_decimal_part: 6
          }
        ]
      })
    })

    // Test with a token that's in the hardcoded no-KYC list
    const usdcRequest: RampCheckSupportRequest = {
      direction: 'sell',
      regionCode: { countryCode: 'CH', stateProvinceCode: undefined },
      fiatAsset: { currencyCode: 'EUR' },
      cryptoAsset: {
        pluginId: 'ethereum',
        tokenId: 'a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48' // USDC
      }
    }

    // USDC is in the hardcoded no-KYC list, so it should still be supported
    const usdcResult = await plugin.checkSupport(usdcRequest)
    expect(usdcResult.supported).toBe(true)

    // Test with a token that's NOT in the hardcoded list
    const randomTokenRequest: RampCheckSupportRequest = {
      direction: 'sell',
      regionCode: { countryCode: 'CH', stateProvinceCode: undefined },
      fiatAsset: { currencyCode: 'EUR' },
      cryptoAsset: {
        pluginId: 'ethereum',
        tokenId: 'randomtokenid123' // Random token not in no-KYC list
      }
    }

    // Random tokens not in the no-KYC list should not be supported
    const randomResult = await plugin.checkSupport(randomTokenRequest)
    expect(randomResult.supported).toBe(false)
  })
})

describe('Example: Using checkSupport API', () => {
  it('should check multiple plugins in parallel', async () => {
    const plugin1 = bityRampPlugin(mockConfig)
    const plugin2 = bityRampPlugin(mockConfig) // Imagine this is another plugin

    const request: RampCheckSupportRequest = {
      direction: 'buy',
      regionCode: { countryCode: 'CH', stateProvinceCode: undefined },
      fiatAsset: { currencyCode: 'EUR' },
      cryptoAsset: { pluginId: 'bitcoin', tokenId: null }
    }

    // Check support on all plugins in parallel
    const supportResults = await Promise.all([
      plugin1.checkSupport(request),
      plugin2.checkSupport(request)
    ])

    // Filter to supported plugins
    const supportedPlugins = [plugin1, plugin2].filter(
      (_, index) => supportResults[index].supported
    )

    console.log(`${supportedPlugins.length} providers support this pair`)

    // Only fetch quotes from supported plugins
    if (supportedPlugins.length > 0) {
      const quoteRequest: RampQuoteRequest = {
        direction: 'buy',
        regionCode: request.regionCode,
        fiatCurrencyCode: `iso:${request.fiatAsset.currencyCode}`,
        exchangeAmount: '100',
        amountType: 'fiat',
        displayCurrencyCode: 'BTC',
        pluginId: request.cryptoAsset.pluginId,
        tokenId: request.cryptoAsset.tokenId,
        pluginUtils: {} as any
      }

      const quotePromises = supportedPlugins.map(
        async plugin => await plugin.fetchQuote(quoteRequest)
      )

      const allQuotes = await Promise.all(quotePromises)
      const flatQuotes = allQuotes.flat()

      console.log(
        `Got ${flatQuotes.length} quotes from ${supportedPlugins.length} providers`
      )
    }
  })
})
