import type { EdgeApiSigner } from 'edge-core-js'
import { NativeModules } from 'react-native'

interface EdgeApiSignerNative {
  signMessage: (message: string) => Promise<{
    apiKey: string
    signature: string
  }>
  getApiKey: () => Promise<string>
}

const nativeModule: EdgeApiSignerNative | undefined =
  NativeModules.EdgeApiSigner

/**
 * True when the native HMAC signer is linked into this build.
 */
export function hasNativeApiSigner(): boolean {
  return nativeModule != null && typeof nativeModule.signMessage === 'function'
}

/**
 * EdgeContextOptions.apiSigner backed by the native module.
 */
export function makeNativeApiSigner(): EdgeApiSigner {
  if (!hasNativeApiSigner()) {
    throw new Error('EdgeApiSigner native module is not available')
  }
  return {
    async signMessage(message: string) {
      return await nativeModule!.signMessage(message)
    }
  }
}

/**
 * Public API key from native (falls back to empty string if unavailable).
 */
export async function getNativeApiKey(): Promise<string> {
  if (!hasNativeApiSigner()) return ''
  return await nativeModule!.getApiKey()
}

/** Synchronous-ish cache filled on first native read. */
let cachedApiKey: string | null = null

export function getCachedNativeApiKey(): string | null {
  return cachedApiKey
}

export async function warmNativeApiKey(): Promise<string> {
  const key = await getNativeApiKey()
  cachedApiKey = key
  return key
}
