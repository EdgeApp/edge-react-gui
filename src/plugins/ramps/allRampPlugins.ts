import { paybisRampPlugin } from './paybis/paybisRampPlugin'
import type { RampPluginFactory } from './rampPluginTypes'

export const pluginFactories: Record<string, RampPluginFactory> = {
  paybis: paybisRampPlugin
}
