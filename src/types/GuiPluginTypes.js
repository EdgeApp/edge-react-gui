// @flow

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

export type BuySellPlugin = {
  id: string,
  pluginId: string,
  priority: number,
  paymentType: string | { [string]: boolean },
  description: string,
  title: string,
  paymentTypeLogoKey: string,
  partnerIconPath: string,
  cryptoCodes?: Array<string>,
  countryCodes?: { [string]: boolean },
  forPlatform?: string,
  forCountries?: Array<string>,
  addOnUrl?: string // Optional suffix to add to plugin URI
}
