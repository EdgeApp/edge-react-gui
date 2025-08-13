import { moonpayRampPlugin } from './moonpay/moonpayRampPlugin'
import { paybisRampPlugin } from './paybis/paybisRampPlugin'
import type { RampPluginFactory } from './rampPluginTypes'
import { revolutRampPlugin } from './revolut/revolutRampPlugin'
import { simplexRampPlugin } from './simplex/simplexRampPlugin'

export const pluginFactories: Record<string, RampPluginFactory> = {
  moonpay: moonpayRampPlugin,
  paybis: paybisRampPlugin,
  revolut: revolutRampPlugin,
  simplex: simplexRampPlugin
}
