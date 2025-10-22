import { banxaRampPlugin } from './banxa/banxaRampPlugin'
import { infiniteRampPlugin } from './infinite/infiniteRampPlugin'
import { moonpayRampPlugin } from './moonpay/moonpayRampPlugin'
import { paybisRampPlugin } from './paybis/paybisRampPlugin'
import type { RampPluginFactory } from './rampPluginTypes'
import { revolutRampPlugin } from './revolut/revolutRampPlugin'
import { simplexRampPlugin } from './simplex/simplexRampPlugin'

export const pluginFactories: Record<string, RampPluginFactory> = {
  banxa: banxaRampPlugin,
  infinite: infiniteRampPlugin,
  moonpay: moonpayRampPlugin,
  paybis: paybisRampPlugin,
  revolut: revolutRampPlugin,
  simplex: simplexRampPlugin
}
