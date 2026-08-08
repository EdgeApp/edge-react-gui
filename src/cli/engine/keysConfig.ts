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

function makeDefaultKeys(): KeysConfig {
  return { edgeApiKey: '', edgeApiSecret: undefined, pluginApiKeys: {} }
}

function isMissingFile(error: unknown): boolean {
  return (
    error != null &&
    typeof error === 'object' &&
    'code' in error &&
    (error as { code: string }).code === 'ENOENT'
  )
}

/** Where loadKeys looks, in order. */
export function keysSearchPaths(): string[] {
  return [resolve('./keys.json'), join(os.homedir(), '.edge-cli', 'keys.json')]
}

function readKeysFile(path: string): KeysConfig | null {
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
    return asKeysConfig(json)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error)
    throw new Error(`Invalid keys.json at ${path}: ${message}`)
  }
}

/**
 * Loads keys.json from (in order):
 * 1. ./keys.json
 * 2. ~/.edge-cli/keys.json
 *
 * Missing files are skipped. Present but invalid JSON/cleaner failures throw
 * so misconfiguration is not silently treated as empty defaults. A file that
 * parses but carries no `edgeApiKey` — such as the GUI's own repo-root
 * keys.json — does not shadow a later file that does have one.
 */
export function loadKeys(): KeysConfig {
  let fallback: KeysConfig | null = null

  for (const path of keysSearchPaths()) {
    const parsed = readKeysFile(path)
    if (parsed == null) continue
    if (parsed.edgeApiKey !== '') return parsed
    fallback ??= parsed
  }

  return fallback ?? makeDefaultKeys()
}
