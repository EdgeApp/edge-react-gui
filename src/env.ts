import CONFIG_JSON from '../config.json'
import KEYS_JSON from '../keys.json'
import { asConfigJson, asKeysJson } from './envConfig'
import { makeEnvFromFiles } from './envFiles'
import { asBase16 } from './util/cleaners/asHex'

// Validate and clean each source file with its own cleaner, then merge the two
// halves into the runtime ENV. Cleaning per file (rather than only the merged
// result) means keys.json is validated on its own and single-run codecs such
// as asBase16 transforms run exactly once. `.withRest` preserves any
// legacy/extra fields the files carry.
//
// The cleaned halves are exported because the keys store re-runs the same
// merge when a remote payload arrives. Cleaning them a second time there would
// duplicate this work and re-feed single-run codecs their own output.
export const bakedConfig = asConfigJson.withRest(CONFIG_JSON)
export const bakedKeys = asKeysJson.withRest(KEYS_JSON)

/**
 * Edge login HMAC credentials live in gitignored `edgeKey.json` (not
 * `keys.json`). Fold them into the baked keys object so ENV / getKeys
 * bootstrap and JS fallbacks still see EDGE_API_KEY / EDGE_API_SECRET.
 */
function applyEdgeKeyToBakedKeys(): void {
  try {
    const edgeKey = require('../edgeKey.json') as {
      apiKey?: string
      apiSecret?: string
    }
    if (typeof edgeKey.apiKey === 'string' && edgeKey.apiKey !== '') {
      ;(bakedKeys as { EDGE_API_KEY?: string }).EDGE_API_KEY = edgeKey.apiKey
    }
    if (typeof edgeKey.apiSecret === 'string' && edgeKey.apiSecret !== '') {
      ;(bakedKeys as { EDGE_API_SECRET?: Uint8Array }).EDGE_API_SECRET =
        asBase16(edgeKey.apiSecret)
    }
  } catch {
    // Missing edgeKey.json is fine for CI stubs / first-time clones.
  }
}

applyEdgeKeyToBakedKeys()

export const ENV = makeEnvFromFiles(bakedConfig, bakedKeys)
