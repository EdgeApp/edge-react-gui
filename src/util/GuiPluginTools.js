// @flow

import { type GuiPlugin, type GuiPluginJson, type GuiPluginQuery, type GuiPluginRow } from '../types/GuiPluginTypes.js'

/**
 * Helper function to turn a GuiPluginJson into a cooked list.
 * Call `asGuiPluginJson` to clean & validate the input file first.
 */
export function filterGuiPluginJson(cleanJson: GuiPluginJson, platform: string, countryCode: string): GuiPluginRow[] {
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
    deepPath?: string,
    deepQuery?: GuiPluginQuery,
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
  if (queryString.length > 0) uri += `?${queryString}`
  return uri
}

export function stringifyQuery(query: GuiPluginQuery): string {
  return Object.keys(query)
    .map(key => {
      let out = encodeURIComponent(key)
      if (query[key] != null) out += `=${encodeURIComponent(query[key])}`
      return out
    })
    .join('&')
}

export function parseQuery(query?: string): GuiPluginQuery {
  if (query == null || query === '') return {}

  // The literal '&' divides query arguments:
  const parts = query.slice(1).split('&')

  const out: GuiPluginQuery = {}
  for (const part of parts) {
    // The literal '=' divides the key from the value:
    const key = part.replace(/=.*/, '')
    const value = part.slice(key.length)

    // Avoid dangerous keys:
    const safeKey = decodeURIComponent(key)
    if (safeKey === '__proto__') continue

    // A key without an '=' gets a null value:
    out[safeKey] = value === '' ? null : decodeURIComponent(value.slice(1))
  }
  return out
}
