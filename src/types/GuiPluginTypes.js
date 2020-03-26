// @flow

export type PluginUrlMap = {
  pluginId: string,
  uri: string,
  name: string,
  supportEmail?: string,
  permissions?: Array<string>,
  originWhitelist?: Array<string>,
  isLegacy?: boolean
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
