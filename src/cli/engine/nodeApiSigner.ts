import type { EdgeApiSigner } from 'edge-core-js'
import fs from 'fs'
import path from 'path'

/**
 * Runtime XOR pad for the Node signer's embedded secret. The CLI gets its own
 * id rather than reusing the mobile bundle id, so a CLI shard set cannot be
 * lifted into a mobile build (or the reverse). Three places must agree, and
 * `scripts/testNodeApiSigner.ts` fails if they drift:
 *
 *   - this constant, which `scripts/makeApiSigner.ts` bakes into the shards
 *   - `EDGE_NODE_BUNDLE_ID` in the generated `edge_api_secret.h`
 *   - the pad `edge_api_signer_napi.c` passes to `edge_api_hmac_sign`
 *
 * It is a local obfuscation detail only: nothing sends it to a server.
 */
export const NODE_API_SIGNER_BUNDLE_ID = 'app.edge.cli'

interface EdgeApiSignerNative {
  signMessage: (message: string) => {
    apiKey: string
    signature: string
  }
  getApiKey: () => string
}

let cachedNative: EdgeApiSignerNative | null | undefined

function candidatePaths(): string[] {
  const here = __dirname
  return [
    // Dev: built next to binding.gyp
    path.join(
      here,
      '../../../native/edge-api-signer/node/build/Release/edge_api_signer.node'
    ),
    path.join(
      here,
      '../../../../native/edge-api-signer/node/build/Release/edge_api_signer.node'
    ),
    // Published CLI: .node shipped beside the rolled-up engine
    path.join(here, 'edge_api_signer.node'),
    path.join(here, '../edge_api_signer.node')
  ]
}

/**
 * Lazily load the N-API addon. Returns null when the binary is missing so
 * local/dev CLI can keep using keys.json apiKey/apiSecret.
 */
export function loadNodeApiSignerNative(): EdgeApiSignerNative | null {
  if (cachedNative !== undefined) return cachedNative

  for (const candidate of candidatePaths()) {
    try {
      if (!fs.existsSync(candidate)) continue
      // Native addon — loaded at runtime when the .node binary exists.
      const mod = require(candidate) as EdgeApiSignerNative
      if (typeof mod.signMessage === 'function') {
        cachedNative = mod
        return cachedNative
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error)
      console.warn(
        `[edge-cli] failed to load Edge API signer at ${candidate}: ${message}`
      )
    }
  }

  cachedNative = null
  return null
}

export function hasNodeApiSigner(): boolean {
  return loadNodeApiSignerNative() != null
}

/**
 * EdgeContextOptions.apiSigner backed by the Node N-API addon.
 */
export function makeNodeApiSigner(): EdgeApiSigner {
  const native = loadNodeApiSignerNative()
  if (native == null) {
    throw new Error('EdgeApiSigner Node native module is not available')
  }
  return {
    async signMessage(message: string) {
      return native.signMessage(message)
    }
  }
}

/** Test helper: clear the cached require result. */
export function resetNodeApiSignerCacheForTests(): void {
  cachedNative = undefined
}
