import { asObject, asString } from 'cleaners'
import type { EdgeApiSigner } from 'edge-core-js'
import { NativeModules } from 'react-native'

import { KEYS } from '../keys'

interface EdgeApiSignerNative {
  signMessage: (message: string) => Promise<unknown>
  getApiKey: () => Promise<string>
}

const asSignedMessage = asObject({
  apiKey: asString,
  signature: asString
})

/**
 * Returns the native module only when it exposes the whole surface this file
 * uses. A build that ships a partial module (mismatched JS/native versions)
 * then degrades to the JS fallback instead of throwing a TypeError.
 */
function getNativeModule(): EdgeApiSignerNative | undefined {
  const module = NativeModules.EdgeApiSigner
  if (
    module == null ||
    typeof module.signMessage !== 'function' ||
    typeof module.getApiKey !== 'function'
  ) {
    return undefined
  }
  return module
}

/**
 * `makeApiSigner.ts` embeds this sentinel when it generates a stub, so a build
 * with no `edgeKey.json` reports a key that is present but unusable. Treat it,
 * and anything else that cannot be an API key, as "no key": splicing it into
 * `Authorization` or `X-Api-Key` yields a malformed header rather than a 401.
 */
export function isUsableApiKey(apiKey: unknown): apiKey is string {
  return typeof apiKey === 'string' && apiKey !== '' && !/\s/.test(apiKey)
}

/**
 * True when the native HMAC signer is linked into this build.
 */
export function hasNativeApiSigner(): boolean {
  return getNativeModule() != null
}

/**
 * True when this build can HMAC-sign an infoRollup request: native signer
 * linked, or a usable JS apiKey/secret pair in KEYS.
 */
export function willSignInfoRollup(): boolean {
  if (hasNativeApiSigner()) return true
  const { EDGE_API_KEY: apiKey, EDGE_API_SECRET: secret } = KEYS
  return isUsableApiKey(apiKey) && secret != null && secret.byteLength > 0
}

/**
 * EdgeContextOptions.apiSigner backed by the native module.
 */
export function makeNativeApiSigner(): EdgeApiSigner {
  const module = getNativeModule()
  if (module == null) {
    throw new Error('EdgeApiSigner native module is not available')
  }
  return {
    async signMessage(message: string) {
      const signed = asSignedMessage(await module.signMessage(message))
      // Stub builds embed a placeholder that is not a valid Authorization value.
      if (!isUsableApiKey(signed.apiKey) || signed.signature === '') {
        throw new Error(
          'EdgeApiSigner returned an unusable apiKey or signature'
        )
      }
      return signed
    }
  }
}

/**
 * Public API key from native (falls back to empty string if unavailable).
 */
export async function getNativeApiKey(): Promise<string> {
  const module = getNativeModule()
  if (module == null) return ''
  const apiKey = await module.getApiKey()
  return isUsableApiKey(apiKey) ? apiKey : ''
}

/** Cache filled on first successful native read (usable keys only). */
let cachedApiKey: string | null = null
let warmPromise: Promise<string> | undefined
let missingKeyWarned = false

export function getCachedNativeApiKey(): string | null {
  return cachedApiKey
}

/**
 * Read the public key from native once and cache it. Never rejects: callers
 * warm this during startup, where a rejection would surface as an error toast
 * for what is only a cache miss.
 */
export async function warmNativeApiKey(): Promise<string> {
  const pending =
    warmPromise ??
    getNativeApiKey().catch((error: unknown) => {
      console.warn('warmNativeApiKey failed', String(error))
      return ''
    })
  warmPromise = pending
  const apiKey = await pending
  // Only clear the slot we just awaited — a later warm must not be orphaned.
  if (warmPromise === pending && apiKey === '') warmPromise = undefined
  // Do not cache empty — that would block the KEYS.EDGE_API_KEY fallback forever.
  if (apiKey !== '') cachedApiKey = apiKey
  return apiKey
}

function keysApiKeyFallback(): string {
  const apiKey = KEYS.EDGE_API_KEY ?? ''
  return isUsableApiKey(apiKey) ? apiKey : ''
}

/**
 * The public API key for Edge-authenticated services (push, notifications).
 *
 * Synchronous: only the cache / KEYS. Prefer `resolveApiKeyAsync` from async
 * callers so a native build can wait out the one-shot warm first.
 */
export function resolveApiKey(): string {
  const apiKey = cachedApiKey ?? keysApiKeyFallback()
  if (apiKey === '' && !missingKeyWarned) {
    missingKeyWarned = true
    console.warn(
      'resolveApiKey: no native EdgeApiSigner key and no KEYS.EDGE_API_KEY'
    )
  }
  return apiKey
}

/**
 * Await the native warm-up, then return a usable public API key (or '').
 */
export async function resolveApiKeyAsync(): Promise<string> {
  if (cachedApiKey != null) return cachedApiKey
  if (hasNativeApiSigner()) {
    const nativeKey = await warmNativeApiKey()
    if (nativeKey !== '') return nativeKey
  }
  return resolveApiKey()
}
