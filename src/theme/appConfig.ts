import { ENV } from '../env'
import { AppConfig } from '../types/types'
import { edgeConfig } from './edgeConfig'
import { testConfig } from './testConfig'

const configs = [edgeConfig, testConfig]
console.log(`ENV.APP_CONFIG:${ENV.APP_CONFIG}`)
const configName = ENV.APP_CONFIG ?? 'edge'
let exportConfig: AppConfig = edgeConfig

for (const c of configs) {
  if (c.configName === configName) {
    exportConfig = c
    break
  }
}
console.log(`config: ${exportConfig.appName} ${exportConfig.configName}`)
export const config = exportConfig
