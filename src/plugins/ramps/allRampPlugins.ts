import { moonpayRampPlugin } from './moonpay/moonpayRampPlugin'
import { paybisRampPlugin } from './paybis/paybisRampPlugin'
import type { RampPluginFactory } from './rampPluginTypes'

export const pluginFactories: Record<string, RampPluginFactory> = {
  moonpay: moonpayRampPlugin,
  paybis: paybisRampPlugin
}
