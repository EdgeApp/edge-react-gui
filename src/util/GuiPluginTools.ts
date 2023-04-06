import { NestedDisableMap } from '../actions/ExchangeInfoActions'
import { GuiPlugin, GuiPluginJson, GuiPluginRow } from '../types/GuiPluginTypes'
import { UriQueryMap } from '../types/WebTypes'
import { stringifyQuery } from './WebUtils'

/**
 * Helper function to turn a GuiPluginJson into a cooked list.
 * Call `asGuiPluginJson` to clean & validate the input file first.
 */
export function filterGuiPluginJson(cleanJson: GuiPluginJson, platform: string, countryCode: string, disablePlugins: NestedDisableMap): GuiPluginRow[] {
  // Filter and merge related rows:
  const mergedRows: { [id: string]: GuiPluginRow } = {}
  const sortIndexes: { [id: string]: number } = {}
  for (const row of cleanJson) {
    if (typeof row === 'string') continue

    // Filtering:
    const { id, forCountries, forPlatform, sortIndex } = row
    if (disablePlugins[id] === true) continue
    if (forCountries != null && !forCountries.includes(countryCode)) continue
    if (forPlatform != null && forPlatform !== platform) continue
    if (sortIndex != null) sortIndexes[id] = sortIndex

    // Defaults:
    if (sortIndexes[id] == null) sortIndexes[id] = 0
    if (mergedRows[id] == null) {
      mergedRows[id] = {
        pluginId: '',
        deepPath: '',
        deepQuery: {},
        title: '',
        description: '',
        paymentTypes: [],
        cryptoCodes: []
      }
    }

    // Merging:
    const merged = mergedRows[id]
    if (row.pluginId != null) merged.pluginId = row.pluginId
    if (row.deepPath != null) merged.deepPath = row.deepPath
    if (row.deepQuery != null) merged.deepQuery = { ...merged.deepQuery, ...row.deepQuery }
    if (row.paymentType != null) merged.paymentType = row.paymentType
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

/**
 * Prepares a plugin's URI.
 */
export function makePluginUri(
  plugin: GuiPlugin,
  opts: {
    deepPath?: string
    deepQuery?: UriQueryMap
    promoCode?: string
  }
): string {
  const { baseUri, baseQuery = {}, lockUriPath = false, queryPromoCode } = plugin
  const { deepPath = '', deepQuery = {}, promoCode } = opts
  const query = { ...baseQuery, ...deepQuery }

  // Grab any extra query parameters:
  if (queryPromoCode != null && promoCode != null) {
    query[queryPromoCode] = promoCode
  }

  // Assemble the URI:
  let uri = baseUri
  if (!lockUriPath) uri += deepPath
  const queryString = stringifyQuery(query)
  if (queryString.length > 0) uri += `${queryString}`
  return uri
}
