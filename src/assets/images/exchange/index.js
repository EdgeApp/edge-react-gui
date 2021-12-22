// @flow

import { type Theme } from '../../../types/Theme.js'
import changellyLogo from './settingsExchangeChangelly.png'
import changenowLogo from './settingsExchangeChangenow.png'
import defaultLogo from './settingsExchangeDefault.png'
import exolixLogo from './settingsExchangeExolix.png'
import foxExchangeLogo from './settingsExchangeFoxExchange.png'
import godexLogo from './settingsExchangeGodex.png'
import sideshiftLogo from './settingsExchangeSideShiftAI.png'
import switchainLogo from './settingsExchangeSwitchain.png'

export function getSwapPluginIcon(pluginId: string, theme?: Theme) {
  if (theme) {
    return swapThemePluginIcons(pluginId, theme)
  }
  const icon = swapPluginIcons[pluginId]
  return icon == null ? defaultLogo : icon
}

// Small icons for the settings using themes:
export const swapThemePluginIcons = (pluginId: string, theme: Theme) => {
  const logos = {
    changelly: theme.settingsChangellyLogo,
    changenow: theme.settingsChangenowLogo,
    exolix: theme.settingsExolixLogo,
    foxExchange: theme.settingsFoxExchangeLogo,
    godex: theme.settingsGodexLogo,
    switchain: theme.settingsSwitchainLogo,
    sideshift: theme.settingsSideshiftLogo,
    default: theme.settingsDefaultLogo
  }
  const icon = logos[pluginId]
  return icon == null ? theme.settingsDefaultLogo : icon
}

// Small icons for the settings:
export const swapPluginIcons = {
  changelly: changellyLogo,
  changenow: changenowLogo,
  exolix: exolixLogo,
  foxExchange: foxExchangeLogo,
  godex: godexLogo,
  sideshift: sideshiftLogo,
  switchain: switchainLogo
}
