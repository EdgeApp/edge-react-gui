import { makeConfig } from 'cleaner-config'

import { asConfigJson, asKeysJson } from '../src/configKeysSchema'

// `config.json` holds non-secret CONFIG settings. Secrets belong in
// `keys.json` (KEYS / globalKeys / plugin maps). Both files are bootstrapped
// here during `prepare` so a fresh clone can bundle without running
// `split-env-json` first. `.withRest` preserves any extra or "comment" keys
// already present in the file.
export const config = makeConfig(asConfigJson.withRest, 'config.json')
export const keys = makeConfig(asKeysJson.withRest, 'keys.json')
