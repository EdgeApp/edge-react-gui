// @flow

import { type Theme } from '../../../types/Theme.js'
import transferFullLogo from '../edgeLogo/Edge_logo_L.png'
import changellyFullLogo from './exchange_logo_changelly.png'
import changenowFullLogo from './exchange_logo_changenow.png'
import coinswitchFullLogo from './exchange_logo_coinswitch.png'
import faastFullLogo from './exchange_logo_faast.png'
import foxExchangeFullLogo from './exchange_logo_fox_exchange.png'
import godexFullLogo from './exchange_logo_godex.png'
import sideshiftFullLogo from './exchange_logo_sideshiftai.png'
import switchainFullLogo from './exchange_logo_switchain.png'
import totleFullLogo from './exchange_logo_totle.png'
import changellyLogo from './settingsExchangeChangelly.png'
import changenowLogo from './settingsExchangeChangenow.png'
import coinswitchLogo from './settingsExchangeCoinswitch.png'
import defaultLogo from './settingsExchangeDefault.png'
import faastLogo from './settingsExchangeFaast.png'
import foxExchangeLogo from './settingsExchangeFoxExchange.png'
import godexLogo from './settingsExchangeGodex.png'
import sideshiftLogo from './settingsExchangeSideShiftAI.png'
import switchainLogo from './settingsExchangeSwitchain.png'
import totleLogo from './settingsExchangeTotle.png'

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
    coinswitch: theme.settingsCoinswitchLogo,
    faast: theme.settingsFaastLogo,
    foxExchange: theme.settingsFoxExchangeLogo,
    godex: theme.settingsGodexLogo,
    switchain: theme.settingsSwitchainLogo,
    sideshift: theme.settingsSideshiftLogo,
    totle: theme.settingsTotleLogo,
    default: theme.settingsDefaultLogo
  }
  const icon = logos[pluginId]
  return icon == null ? theme.settingsDefaultLogo : icon
}

// Small icons for the settings:
export const swapPluginIcons = {
  changelly: changellyLogo,
  changenow: changenowLogo,
  coinswitch: coinswitchLogo,
  faast: faastLogo,
  foxExchange: foxExchangeLogo,
  godex: godexLogo,
  sideshift: sideshiftLogo,
  switchain: switchainLogo,
  totle: totleLogo
}

// Big logos for the quote scene:
export const swapPluginLogos = {
  changelly: changellyFullLogo,
  changenow: changenowFullLogo,
  coinswitch: coinswitchFullLogo,
  faast: faastFullLogo,
  foxExchange: foxExchangeFullLogo,
  godex: godexFullLogo,
  sideshift: sideshiftFullLogo,
  switchain: switchainFullLogo,
  totle: totleFullLogo,
  transfer: transferFullLogo
}
