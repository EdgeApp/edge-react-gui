// @flow
import { EDGE_CONTENT_SERVER_URI } from '../constants/CdnConstants'
import { type Theme } from '../types/Theme'
import { removeHexPrefix } from './utils'

/**
 * Swap Plugin Icons
 */

export function getSwapPluginIconUri(pluginId: string, theme: Theme) {
  return `${theme.exchangeLogoBaseUri}/${pluginId}/icon.png`
}

/**
 * Currency Icons
 */
export type CurrencyIcons = {
  symbolImage: string,
  symbolImageDarkMono: string
}

export function getCurrencyIconUris(pluginId: string, contractAddress?: string = pluginId): CurrencyIcons {
  const currencyPath = `${pluginId}/${removeHexPrefix(contractAddress)}`.toLowerCase()
  const url = `${EDGE_CONTENT_SERVER_URI}/currencyIcons/${currencyPath}`
  return {
    symbolImage: `${url}.png`,
    symbolImageDarkMono: `${url}_dark.png`
  }
}

/**
 * Partner Icons
 */

// TODO: Add other CDN references to the theme files to allow third-party config:
// flags, partners, etc
export function getPartnerIconUri(partnerIconPath: string) {
  return `${EDGE_CONTENT_SERVER_URI}/${partnerIconPath}`
}
