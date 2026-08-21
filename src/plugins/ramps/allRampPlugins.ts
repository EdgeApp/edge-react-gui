import { banxaRampPlugin } from './banxa/banxaRampPlugin'
import { bitsofgoldRampPlugin } from './bitsofgold/bitsofgoldRampPlugin'
import { coinhubAtmRampPlugin } from './coinhub/coinhubAtmRampPlugin'
import { coinhubExchangeRampPlugin } from './coinhub/coinhubExchangeRampPlugin'
import { coinhubFundedRampPlugin } from './coinhub/coinhubFundedRampPlugin'
import { infiniteRampPlugin } from './infinite/infiniteRampPlugin'
import { libertyxRampPlugin } from './libertyx/libertyxRampPlugin'
import { moonpayRampPlugin } from './moonpay/moonpayRampPlugin'
import { paybisRampPlugin } from './paybis/paybisRampPlugin'
import type { RampPluginFactory } from './rampPluginTypes'
import { revolutRampPlugin } from './revolut/revolutRampPlugin'
import { simplexRampPlugin } from './simplex/simplexRampPlugin'

export const pluginFactories: Record<string, RampPluginFactory> = {
  banxa: banxaRampPlugin,
  bitsofgold: bitsofgoldRampPlugin,
  coinhubatm: coinhubAtmRampPlugin,
  coinhubexchange: coinhubExchangeRampPlugin,
  coinhubfunded: coinhubFundedRampPlugin,
  infinite: infiniteRampPlugin,
  libertyx: libertyxRampPlugin,
  moonpay: moonpayRampPlugin,
  paybis: paybisRampPlugin,
  revolut: revolutRampPlugin,
  simplex: simplexRampPlugin
}

/**
 * Plugins that hold no credentials and therefore need no `RAMP_PLUGIN_INITS`
 * entry to load. Everything else stays off until the build's env.json supplies
 * its keys.
 */
export const credentiallessPluginIds = new Set([
  'coinhubatm',
  'coinhubexchange',
  'coinhubfunded'
])
