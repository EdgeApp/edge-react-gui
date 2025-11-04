import { banxaRampPlugin } from './banxa/banxaRampPlugin'
import { bitsofgoldRampPlugin } from './bitsofgold/bitsofgoldRampPlugin'
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
  infinite: infiniteRampPlugin,
  libertyx: libertyxRampPlugin,
  moonpay: moonpayRampPlugin,
  paybis: paybisRampPlugin,
  revolut: revolutRampPlugin,
  simplex: simplexRampPlugin
}
