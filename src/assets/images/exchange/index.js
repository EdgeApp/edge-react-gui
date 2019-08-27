// @flow

import changellyFullLogo from './exchange_logo_changelly.png'
import changenowFullLogo from './exchange_logo_changenow.png'
import coinswitchFullLogo from './exchange_logo_coinswitch.png'
import faastFullLogo from './exchange_logo_faast.png'
import foxExchangeFullLogo from './exchange_logo_fox_exchange.png'
import godexFullLogo from './exchange_logo_godex.png'
import shapeshiftFullLogo from './exchange_logo_shapeshift.png'
import totleFullLogo from './exchange_logo_totle.png'
import changellyLogo from './settingsExchangeChangelly.png'
import changenowLogo from './settingsExchangeChangenow.png'
import coinswitchLogo from './settingsExchangeCoinswitch.png'
import defaultLogo from './settingsExchangeDefault.png'
import faastLogo from './settingsExchangeFaast.png'
import foxExchangeLogo from './settingsExchangeFoxExchange.png'
import godexLogo from './settingsExchangeGodex.png'
import shapeshiftLogo from './settingsExchangeShapeshift.png'
import totleLogo from './settingsExchangeTotle.png'

export function getSwapPluginIcon (pluginId: string) {
  const icon = swapPluginIcons[pluginId]
  return icon == null ? defaultLogo : icon
}

// Small icons for the settings:
export const swapPluginIcons = {
  changelly: changellyLogo,
  changenow: changenowLogo,
  coinswitch: coinswitchLogo,
  faast: faastLogo,
  foxExchange: foxExchangeLogo,
  godex: godexLogo,
  shapeshift: shapeshiftLogo,
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
  shapeshift: shapeshiftFullLogo,
  totle: totleFullLogo
}
