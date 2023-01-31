import { makeConfig } from 'cleaner-config'

import { asEnvConfig } from '../src/envConfig'

export const config = makeConfig(asEnvConfig, 'env.json')
