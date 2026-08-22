import { NativeModules } from 'react-native'

const { EdgeCurrencyAccountbasedModule } = NativeModules
const { sourceUri } = EdgeCurrencyAccountbasedModule.getConstants()

export const debugUri = 'http://localhost:8082/edge-currency-accountbased.js'
export const pluginUri = sourceUri

export function makePluginIo() {
  return {}
}
