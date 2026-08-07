/**
 * Load GUI-style config.json (swapPlugins / optional plugin toggles).
 * Searches ./config.json then ~/.edge-cli/config.json.
 */
import fs from 'fs'
import os from 'os'
import { join, resolve } from 'path'

export interface AppConfigFile {
  swapPlugins?: Record<string, unknown>
  pluginApiKeys?: Record<string, unknown>
}

export function loadAppConfig(): AppConfigFile {
  const paths = [
    resolve('./config.json'),
    join(os.homedir(), '.edge-cli', 'config.json')
  ]
  for (const p of paths) {
    try {
      const json = JSON.parse(fs.readFileSync(p, 'utf8')) as AppConfigFile
      return json
    } catch {
      // try next
    }
  }
  return {}
}
