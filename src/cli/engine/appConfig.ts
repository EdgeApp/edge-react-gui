/**
 * Load GUI-style config.json (swapPlugins).
 * Searches ./config.json then ~/.edge-cli/config.json.
 */
import { asObject, asOptional, asUnknown, type Cleaner } from 'cleaners'
import fs from 'fs'
import os from 'os'
import { join, resolve } from 'path'

export interface AppConfigFile {
  swapPlugins?: Record<string, unknown>
}

const asAppConfigFile: Cleaner<AppConfigFile> = asObject({
  swapPlugins: asOptional(asObject(asUnknown))
})

function isMissingFile(error: unknown): boolean {
  return (
    error != null &&
    typeof error === 'object' &&
    'code' in error &&
    (error as { code: string }).code === 'ENOENT'
  )
}

/** Where loadAppConfig looks, in order. */
export function appConfigSearchPaths(): string[] {
  return [
    resolve('./config.json'),
    join(os.homedir(), '.edge-cli', 'config.json')
  ]
}

function readAppConfigFile(path: string): AppConfigFile | null {
  let text: string
  try {
    text = fs.readFileSync(path, 'utf8')
  } catch (error: unknown) {
    if (isMissingFile(error)) return null
    throw error
  }
  let json: unknown
  try {
    json = JSON.parse(text)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error)
    throw new Error(`Invalid JSON in ${path}: ${message}`)
  }
  try {
    return asAppConfigFile(json)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error)
    throw new Error(`Invalid config.json at ${path}: ${message}`)
  }
}

/**
 * Loads config.json from (in order):
 * 1. ./config.json
 * 2. ~/.edge-cli/config.json
 *
 * Missing files are skipped. Present but invalid JSON/cleaner failures throw,
 * matching loadKeys, so a typo cannot silently disable every swap plugin.
 */
export function loadAppConfig(): AppConfigFile {
  for (const path of appConfigSearchPaths()) {
    const parsed = readAppConfigFile(path)
    if (parsed != null) return parsed
  }
  return {}
}
