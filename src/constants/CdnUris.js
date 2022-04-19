// @flow
import { type Theme } from '../types/Theme'

// Get themed plugin icons from content server
export function getSwapPluginIconUri(pluginId: string, theme: Theme) {
  return `${theme.exchangeLogoBaseUrl}/${pluginId}.png`
}
