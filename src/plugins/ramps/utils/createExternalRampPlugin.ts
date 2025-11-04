import type { EdgeTokenId } from 'edge-core-js'

import type { PluginViewParams } from '../../../components/scenes/GuiPluginViewScene'
import { lstrings } from '../../../locales/strings'
import type { GuiPlugin } from '../../../types/GuiPluginTypes'
import type { FiatPaymentType } from '../../gui/fiatPluginTypes'
import type {
  RampCheckSupportRequest,
  RampPlugin,
  RampPluginConfig,
  RampQuote,
  RampQuoteRequest,
  RampSupportResult,
  SettlementRange
} from '../rampPluginTypes'

/**
 * Configuration for an external ramp plugin. This is a template configuration
 * for the external ramp plugin factory function to define the plugin information
 * and supported quote data.
 *
 * The RampPlugin instance implements the legacy EdgeProvider infrastructure,
 * so the `guiPlugin` is a necessary dependency.
 */
export interface ExternalRampPluginConfig {
  /** The partner icon of the plugin */
  readonly partnerIcon: string
  /**
   * The GuiPlugin information as a dependency on the legacy EdgeProvider
   * infrastructure.
   */
  readonly guiPlugin: GuiPlugin
  /** The buy support data */
  readonly buy?: DirectionSupportData
  /** The sell support data */
  readonly sell?: DirectionSupportData
}

/**
 * Support data for a direction (buy or sell) of an external ramp plugin.
 * This is used to define the supported payment types, countries, excluded states,
 * fiat currency codes, crypto assets, settlement range, deep path, and deep query.
 */
export interface DirectionSupportData {
  /** The payment types supported by the plugin */
  readonly paymentTypes: FiatPaymentType[]
  /** The countries supported by the plugin */
  readonly countries: string[]
  /** The excluded states supported by the plugin */
  readonly excludedStates?: Record<string, string[]>
  /** The fiat currency codes supported by the plugin */
  readonly fiatCurrencyCodes?: string[]
  /** The crypto assets supported by the plugin */
  readonly cryptoAssets: ReadonlyArray<{
    readonly pluginId: string
    readonly tokenId: EdgeTokenId
  }>
  /** The settlement range supported by the plugin */
  readonly settlementRange: SettlementRange
  /** The deep path from within the GuiPlugin's defined `baseUri`. */
  readonly deepPath: string
  /** A set of query parameters to pass to a plugin. */
  readonly deepQuery?: Record<string, string>
}

/**
 * Creates an external ramp plugin. This is a factory function which creates a
 * RampPlugin which implements a Edge webview for the ramp provider. There is
 * no quoting API for these external RampPlugins, but instead the quote fiat
 * and crypto amounts are set to 0 and the user is taken to the provider's
 * website to view the quote.
 *
 * @param pluginId - The plugin ID
 * @param externalConfig - The external ramp plugin config
 * @param config - The ramp plugin config
 * @returns
 */
export function createExternalRampPlugin(
  pluginId: string,
  externalConfig: ExternalRampPluginConfig,
  config: RampPluginConfig
): RampPlugin {
  if (externalConfig == null) {
    throw new Error(`Missing external ramp provider defaults for ${pluginId}`)
  }

  return {
    pluginId,
    rampInfo: {
      partnerIcon: externalConfig.partnerIcon,
      pluginDisplayName: externalConfig.guiPlugin.displayName
    },

    async checkSupport(
      request: RampCheckSupportRequest
    ): Promise<RampSupportResult> {
      const support = getDirectionSupport(externalConfig, request.direction)
      if (support == null) return { supported: false }

      if (!matchesCountry(support.countries, request.regionCode.countryCode)) {
        return { supported: false }
      }

      if (
        support.excludedStates != null &&
        isExcludedState(support.excludedStates, request.regionCode)
      ) {
        return { supported: false }
      }

      if (
        support.fiatCurrencyCodes != null &&
        support.fiatCurrencyCodes.length > 0 &&
        !supportsFiat(support.fiatCurrencyCodes, request.fiatAsset.currencyCode)
      ) {
        return { supported: false }
      }

      if (!matchesCryptoAsset(support.cryptoAssets, request.cryptoAsset)) {
        return { supported: false }
      }

      return { supported: true }
    },

    async fetchQuotes(request: RampQuoteRequest) {
      const support = getDirectionSupport(externalConfig, request.direction)
      if (support == null) return []

      if (
        !matchesCountry(support.countries, request.regionCode.countryCode) ||
        (support.excludedStates != null &&
          isExcludedState(support.excludedStates, request.regionCode)) ||
        (support.fiatCurrencyCodes != null &&
          support.fiatCurrencyCodes.length > 0 &&
          !supportsFiat(support.fiatCurrencyCodes, request.fiatCurrencyCode)) ||
        !matchesCryptoAsset(support.cryptoAssets, {
          pluginId: request.wallet.currencyInfo.pluginId,
          tokenId: request.tokenId
        })
      ) {
        return []
      }

      return support.paymentTypes.map(
        (paymentType): RampQuote => ({
          pluginId,
          partnerIcon: externalConfig.partnerIcon,
          pluginDisplayName: externalConfig.guiPlugin.displayName,
          displayCurrencyCode: request.displayCurrencyCode,
          cryptoAmount: '0',
          isEstimate: true,
          fiatCurrencyCode: request.fiatCurrencyCode,
          fiatAmount: '0',
          direction: request.direction,
          regionCode: request.regionCode,
          paymentType,
          settlementRange: support.settlementRange,
          specialQuoteRateMessage: lstrings.tap_to_view_quote_amount_and_rate,
          approveQuote: async () => {
            // Launch!
            const navigationProps: PluginViewParams = {
              plugin: externalConfig.guiPlugin,
              deepPath: support.deepPath,
              deepQuery: support.deepQuery
            }

            if (request.direction === 'buy') {
              config.navigation.navigate('pluginViewBuy', navigationProps)
            } else {
              config.navigation.navigate('pluginViewSell', navigationProps)
            }
          },
          closeQuote: async () => {}
        })
      )
    }
  }
}

function getDirectionSupport(
  data: ExternalRampPluginConfig,
  direction: 'buy' | 'sell'
): DirectionSupportData | undefined {
  return direction === 'buy' ? data.buy : data.sell
}

function matchesCountry(countries: string[], countryCode: string): boolean {
  if (countries.length === 0) return true
  return countries.includes(countryCode)
}

function isExcludedState(
  excludedStates: Record<string, string[]>,
  region: { countryCode: string; stateProvinceCode?: string }
): boolean {
  const states = excludedStates[region.countryCode]
  if (states == null) return false
  if (region.stateProvinceCode == null) return false
  return states.includes(region.stateProvinceCode)
}

function supportsFiat(
  fiatCodes: readonly string[],
  currencyCode: string
): boolean {
  const normalized = normalizeFiatCode(currencyCode)
  return fiatCodes.some(code => normalizeFiatCode(code) === normalized)
}

function normalizeFiatCode(currencyCode: string): string {
  return currencyCode.toUpperCase().replace(/^ISO:/, '')
}

function matchesCryptoAsset(
  assets: ReadonlyArray<{ pluginId: string; tokenId: string | null }>,
  asset: { pluginId: string; tokenId: string | null }
): boolean {
  return assets.some(
    item => item.pluginId === asset.pluginId && item.tokenId === asset.tokenId
  )
}
