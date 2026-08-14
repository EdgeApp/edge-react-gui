import KEYS_JSON from '../keys.json'
import { nestGlobalKeys } from './configKeysMerge'
import { asKeysJson, type RuntimeKeys } from './configKeysSchema'

/**
 * Baked-in keys.json after nesting partner secrets under `globalKeys`. Used as
 * the merge base when a remote/cache overlay arrives — never mutated.
 */
export const bakedKeys: RuntimeKeys = nestGlobalKeys(
  asKeysJson.withRest(KEYS_JSON) as unknown as Record<string, unknown>
)

/**
 * Mutable runtime keys. Remote/cache overlays update this object in place via
 * `applyRuntimeKeys`. Partner secrets live only under `KEYS.globalKeys`.
 */
export const KEYS: RuntimeKeys = {
  ...bakedKeys,
  globalKeys: { ...bakedKeys.globalKeys }
}

/**
 * Live alias of `KEYS.globalKeys`. Same object reference — overlays mutate this
 * map in place so `import { globalKeys }` stays current after initializeKeys.
 */
export const globalKeys = KEYS.globalKeys

/**
 * Replace KEYS contents from a merged RuntimeKeys value while preserving the
 * exported `globalKeys` object identity.
 */
export function applyRuntimeKeys(next: RuntimeKeys): void {
  const keysRecord = KEYS as unknown as Record<string, unknown>
  const nextRecord = next as unknown as Record<string, unknown>
  const nextTop = new Set(
    Object.keys(nextRecord).filter(key => key !== 'globalKeys')
  )

  for (const key of Object.keys(keysRecord)) {
    if (key === 'globalKeys') continue
    if (!nextTop.has(key)) keysRecord[key] = undefined
  }
  for (const key of nextTop) {
    keysRecord[key] = nextRecord[key]
  }

  const nextGk = (next.globalKeys ?? {}) as Record<string, unknown>
  const gkRecord = globalKeys as unknown as Record<string, unknown>
  for (const key of Object.keys(gkRecord)) {
    if (!(key in nextGk)) gkRecord[key] = undefined
  }
  Object.assign(globalKeys, nextGk)
  KEYS.globalKeys = globalKeys
}
