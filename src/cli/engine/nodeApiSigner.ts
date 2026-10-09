import type { EdgeApiSigner } from 'edge-core-js'
import fs from 'fs'
import path from 'path'

import { errorMessage } from './errors'

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

/**
 * Whether a loaded module is the addon this file's interface declares.
 *
 * A separate function, and exported, because this is the arm that used to
 * fail in silence: a `.node` that loads and exports the wrong thing is a
 * built addon the engine then ignores, which is indistinguishable from an
 * addon that was never built. The `require` arm beside it has always warned.
 *
 * Only `signMessage` is required, because that is all `makeNodeApiSigner`
 * calls: `getApiKey` is part of the addon's own surface — the real one
 * exports it — and nothing in this engine reads it, so demanding it would
 * reject an addon that works.
 */
export function isApiSignerNative(
  mod: unknown,
  candidate: string,
  warn: (message: string) => void = console.warn
): mod is EdgeApiSignerNative {
  const signMessage = (mod as Record<string, unknown> | null)?.signMessage
  if (typeof signMessage === 'function') return true
  warn(
    `[edge-engine] Edge API signer at ${candidate} exports no ` +
      'signMessage(); skipping it'
  )
  return false
}

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
 *
 * Both rejection paths say something. The shape check used to `continue` in
 * silence, so a `.node` that loaded and did not export this interface was
 * skipped without a word, `hasNodeApiSigner()` answered false, and an
 * operator who had just built the addon saw either keys.json signing or
 * `No HMAC credentials available for infoRollup appKeys` — a message naming
 * the wrong cause. The signer decides which `appKeys` layer the info server
 * serves, so the symptom is a plugin starting with no keys.
 */
function loadNodeApiSignerNative(): EdgeApiSignerNative | null {
  if (cachedNative !== undefined) return cachedNative

  for (const candidate of candidatePaths()) {
    try {
      if (!fs.existsSync(candidate)) continue
      // Native addon — loaded at runtime when the .node binary exists.
      const mod: unknown = require(candidate)
      if (!isApiSignerNative(mod, candidate)) continue
      cachedNative = mod
      return cachedNative
    } catch (error: unknown) {
      const message = errorMessage(error)
      console.warn(
        `[edge-engine] failed to load Edge API signer at ${candidate}: ${message}`
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
