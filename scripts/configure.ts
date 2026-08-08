import { makeConfig } from 'cleaner-config'

import { asConfigJson } from '../src/envConfig'

// `config.json` is the non-secret half of the runtime `ENV` union. Secrets
// belong in `keys.json` (see `asKeysJson`) and must not be defaulted/written
// here by `makeConfig` during `prepare`, which is why this uses the
// config-only cleaner rather than the full `asEnvConfig`. `.withRest`
// preserves any extra or "comment" keys already present in the file.
export const config = makeConfig(asConfigJson.withRest, 'config.json')
