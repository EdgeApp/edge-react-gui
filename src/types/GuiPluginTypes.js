// @flow

import { asArray, asEither, asMap, asNull, asNumber, asObject, asOptional, asString } from 'cleaners'

import { type Permission } from '../reducers/PermissionsReducer.js'

/**
 * A set of query parameters to pass to a plugin.
 */
export type GuiPluginQuery = {
  // Use a string for key/value queries, like `?foo=bar`
  // Use null for key-only queries, like `?baz`
  [key: string]: string | null
}

/**
 * A unique WebView-based plugin.
 *
 * This contains just the information needed to launch the plugin,
 * either from the plugin list or from a deep link.
 *
 * The plugin list uses additional information for its sorting & filtering,
 * which lives in other data structures.
 */
export type GuiPlugin = {
  // This pluginId should be short and use dashes to separate words,
  // since it appears in deep links like `edge://plugin/moonpay-buy`:
  pluginId: string,

  // The storage location to make available in the `EdgeProvider`.
  // Also used for conversion tracking:
  storeId: string,

  // The URI to show in the WebView.
  // Both the plugin list & deep links can add stuff to the end of this:
  baseUri: string,
  baseQuery?: GuiPluginQuery,

  // Don't append the deep path to the URI when set:
  lockUriPath?: true,

  // Pass any promo codes using this query parameter:
  queryPromoCode?: string,

  // Add country code as a query parameter when launching plugin
  needsCountryCode?: boolean,

  // Scene title to display when inside the plugin:
  displayName: string,

  // The WebView won't navigate to hostnames outside of this list:
  originWhitelist?: string[],

  // Device permissions to acquire before launching the plugin:
  permissions?: Permission[],
  mandatoryPermissions?: boolean
}

/**
 * A row in the plugin list scene, after being distilled down from JSON.
 */
export type GuiPluginRow = {
  pluginId: string,
  deepPath: string,
  deepQuery: GuiPluginQuery,

  title: string,
  description: string,
  partnerIconPath?: string,
  paymentTypeLogoKey?: string,
  paymentTypes: string[],
  cryptoCodes: string[]
}

/**
 * The plugin list scene stores its data in JSON files,
 * which have an array of these rows mixed with strings for comments.
 */
const asGuiPluginJsonRow = asObject({
  // A unique string to identify this particular row:
  id: asString,

  // The plugin to display if we select this item:
  pluginId: asOptional(asString),

  // Optional stuff to add to the plugin URI:
  deepPath: asOptional(asString),
  deepQuery: asOptional(asMap(asEither(asString, asNull))),

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
export type GuiPluginJson = $Call<typeof asGuiPluginJson, any>
