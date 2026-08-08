import CONFIG_JSON from '../config.json'
import KEYS_JSON from '../keys.json'
import { asConfigJson, asKeysJson } from './envConfig'
import { makeEnvFromFiles } from './envFiles'

// Validate and clean each source file with its own cleaner, then merge the two
// halves into the runtime ENV. Cleaning per file (rather than only the merged
// result) means keys.json is validated on its own and single-run codecs such
// as EDGE_API_SECRET's asBase16 transform run exactly once. `.withRest`
// preserves any legacy/extra fields the files carry.
//
// The cleaned halves are exported because the keys store re-runs the same
// merge when a remote payload arrives. Cleaning them a second time there would
// duplicate this work and re-feed single-run codecs their own output.
export const bakedConfig = asConfigJson.withRest(CONFIG_JSON)
export const bakedKeys = asKeysJson.withRest(KEYS_JSON)

export const ENV = makeEnvFromFiles(bakedConfig, bakedKeys)
