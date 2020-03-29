// @flow

import { asArray, asEither, asNumber, asObject, asOptional, asString } from 'cleaners'

import { type Permission } from '../reducers/PermissionsReducer.js'

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

  // Scene title to display when inside the plugin:
  displayName: string,

  // Use the Airbitz-based API when set, instead of EdgeProvider:
  isLegacy?: true,

  // The WebView won't navigate to hostnames outside of this list:
  originWhitelist?: string[],

  // Device permissions to acquire before launching the plugin:
  permissions?: Permission[]
}

/**
 * A row in the plugin list scene, after being distilled down from JSON.
 */
export type GuiPluginRow = {
  pluginId: string,
  addOnUrl: string,

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

  // Optional suffix to add to plugin URI:
  addOnUrl: asOptional(asString),

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

/**
 * Helper function to turn a GuiPluginJson into a cooked list.
 * Call `asGuiPluginJson` to clean & validate the input file first.
 */
export function filterGuiPluginJson (cleanJson: GuiPluginJson, platform: string, countryCode: string): GuiPluginRow[] {
  // Filter and merge related rows:
  const mergedRows: { [id: string]: GuiPluginRow } = {}
  const sortIndexes: { [id: string]: number } = {}
  for (const row of cleanJson) {
    if (typeof row === 'string') continue

    // Filtering:
    const { id, forCountries, forPlatform, sortIndex } = row
    if (forCountries != null && forCountries.indexOf(countryCode) < 0) continue
    if (forPlatform != null && forPlatform !== platform) continue
    if (sortIndex != null) sortIndexes[id] = sortIndex

    // Defaults:
    if (sortIndexes[id] == null) sortIndexes[id] = 0
    if (mergedRows[id] == null) {
      mergedRows[id] = {
        pluginId: '',
        addOnUrl: '',
        title: '',
        description: '',
        paymentTypes: [],
        cryptoCodes: []
      }
    }

    // Merging:
    const merged = mergedRows[id]
    if (row.pluginId != null) merged.pluginId = row.pluginId
    if (row.addOnUrl != null) merged.addOnUrl = row.addOnUrl
    if (row.title != null) merged.title = row.title
    if (row.description != null) merged.description = row.description
    if (row.partnerIconPath != null) merged.partnerIconPath = row.partnerIconPath
    if (row.paymentTypeLogoKey != null) merged.paymentTypeLogoKey = row.paymentTypeLogoKey
    if (row.paymentTypes != null) merged.paymentTypes = row.paymentTypes
    if (row.cryptoCodes != null) merged.cryptoCodes = row.cryptoCodes
  }

  // Build the sorted output list, removing rows without pluginIds:
  return Object.keys(mergedRows)
    .filter(id => mergedRows[id].pluginId !== '')
    .sort((a, b) => sortIndexes[a] - sortIndexes[b])
    .map(id => mergedRows[id])
}
