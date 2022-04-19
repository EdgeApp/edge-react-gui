// @flow
import { type Theme } from '../types/Theme'

export function getSwapPluginIconUri(pluginId: string, theme: Theme) {
  return `${theme.exchangeLogoBaseUri}/${pluginId}/icon.png`
}
