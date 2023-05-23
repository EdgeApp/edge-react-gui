import { asArray, asEither, asNull, asNumber, asObject, asOptional, asString } from 'cleaners'

import { asFiatPaymentType, FiatPaymentType, FiatPluginFactory } from '../plugins/gui/fiatPluginTypes'
import { Permission } from '../reducers/PermissionsReducer'
import { EdgeTokenId } from '../types/types'
import { UriQueryMap } from './WebTypes'
/**
 * A unique WebView-based plugin.
 *
 * This contains just the information needed to launch the plugin,
 * either from the plugin list or from a deep link.
 *
 * The plugin list uses additional information for its sorting & filtering,
 * which lives in other data structures.
 */
export interface GuiPlugin {
  // This pluginId should be short and use dashes to separate words,
  // since it appears in deep links like `edge://plugin/moonpay-buy`:
  pluginId: string

  // The storage location to make available in the `EdgeProvider`.
  // Also used for conversion tracking:
  storeId: string

  // Is a native plugin written in React Native
  nativePlugin?: FiatPluginFactory

  // The URI to show in the WebView.
  // Both the plugin list & deep links can add stuff to the end of this:
  baseUri: string
  baseQuery?: UriQueryMap

  // Don't append the deep path to the URI when set:
  lockUriPath?: true

  // Pass any promo codes using this query parameter:
  queryPromoCode?: string

  // Add country code as a query parameter when launching plugin
  needsCountryCode?: boolean

  // Scene title to display when inside the plugin:
  displayName: string

  // Name to show next to Powered by. Uses displayName if missing
  poweredBy?: string

  // The WebView won't navigate to hostnames outside of this list:
  originWhitelist?: string[]

  // Device permissions to acquire before launching the plugin:
  permissions?: Permission[]
  mandatoryPermissions?: boolean

  // Sometimes plugins pass weird strings for their currency codes:
  fixCurrencyCodes?: { [badString: string]: EdgeTokenId }

  // Plugin would show only with BETA_FEATURE env flag
  betaOnly?: boolean
}

/**
 * A row in the plugin list scene, after being distilled down from JSON.
 */
export interface GuiPluginRow {
  pluginId: string
  deepPath: string
  deepQuery: UriQueryMap

  title: string
  description: string
  paymentType?: FiatPaymentType
  partnerIconPath?: string
  paymentTypeLogoKey?: string
  paymentTypes: string[]
  cryptoCodes: string[]
}

/**
 * The plugin list scene stores its data in JSON files,
 * which have an array of these rows unknown with strings for comments.
 */
const asGuiPluginJsonRow = asObject({
  // A unique string to identify this particular row:
  id: asString,

  // The plugin to display if we select this item:
  pluginId: asOptional(asString),

  // Optional stuff to add to the plugin URI:
  deepPath: asOptional(asString),
  deepQuery: asOptional(asObject(asEither(asString, asNull))),

  // Optional params to sent to native Fiat Plugins
  paymentType: asOptional(asFiatPaymentType),

  // List display options:
  title: asOptional(asString),
  description: asOptional(asString),
  partnerIconPath: asOptional(asString),
  paymentTypeLogoKey: asOptional(asString),
  paymentTypes: asOptional(asArray(asString)),
  cryptoCodes: asOptional(asArray(asString)),

  // Filtering & sorting:
  forCountries: asOptional(asArray(asString)),
  forPlatform: asOptional(asString),
  sortIndex: asOptional(asNumber)
})
export const asGuiPluginJson = asArray(asEither(asString, asGuiPluginJsonRow))
export const asBuySellPlugins = asObject({
  // If either buy or sell is undefined, fallback to app defaults and purge disk cache
  buy: asOptional(asGuiPluginJson),
  sell: asOptional(asGuiPluginJson)
})

export type GuiPluginJson = ReturnType<typeof asGuiPluginJson>
export type BuySellPlugins = ReturnType<typeof asBuySellPlugins>
