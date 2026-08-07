import {
  asObject,
  asOptional,
  asString,
  asUnknown,
  type Cleaner
} from 'cleaners'
import fs from 'fs'
import os from 'os'
import { join, resolve } from 'path'

export interface KeysConfig {
  edgeApiKey: string
  edgeApiSecret?: string
  pluginApiKeys: Record<string, unknown>
}

const asKeysConfig: Cleaner<KeysConfig> = asObject({
  edgeApiKey: asOptional(asString, ''),
  edgeApiSecret: asOptional(asString),
  pluginApiKeys: asOptional(asObject(asUnknown), () => ({}))
})

const defaultKeys: KeysConfig = {
  edgeApiKey: '',
  edgeApiSecret: undefined,
  pluginApiKeys: {}
}

/**
 * Loads keys.json from (in order):
 * 1. ./keys.json
 * 2. ~/.edge-cli/keys.json
 */
export function loadKeys(): KeysConfig {
  const searchPaths = [
    resolve('./keys.json'),
    join(os.homedir(), '.edge-cli', 'keys.json')
  ]

  for (const path of searchPaths) {
    try {
      const text = fs.readFileSync(path, 'utf8')
      const json = JSON.parse(text)
      return asKeysConfig(json)
    } catch {
      // try next
    }
  }

  return defaultKeys
}
