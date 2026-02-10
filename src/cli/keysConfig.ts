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
 * Loads the keys.json configuration file.
 * Searches in order:
 * 1. Repository root (./keys.json)
 * 2. User home directory (~/.edge-cli/keys.json)
 *
 * Returns default values if no file is found.
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
      const keys = asKeysConfig(json)
      console.log(`Loaded keys from ${path}`)
      return keys
    } catch (error) {
      // File doesn't exist or is invalid, try next path
    }
  }

  // No keys file found, use defaults
  return defaultKeys
}
