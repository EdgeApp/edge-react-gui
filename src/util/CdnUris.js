// @flow
import { EDGE_CONTENT_SERVER_URI } from '../constants/CdnConstants'
import { type Theme } from '../types/Theme'

export function getSwapPluginIconUri(pluginId: string, theme: Theme) {
  return `${theme.exchangeLogoBaseUri}/${pluginId}/icon.png`
}

// TODO: Add other CDN references to the theme files to allow third-party config:
// flags, currency icons, partners, etc
export function getPartnerIconUri(partnerIconPath: string) {
  return `${EDGE_CONTENT_SERVER_URI}/${partnerIconPath}`
}
