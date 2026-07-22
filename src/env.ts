import CONFIG_JSON from '../config.json'
import KEYS_JSON from '../keys.json'
import { asEnvConfig } from './envConfig'
import { makeEnvFromFiles } from './envFiles'

export const ENV = asEnvConfig(makeEnvFromFiles(CONFIG_JSON, KEYS_JSON))
