import ENV_JSON from '../env.json'
import { asEnvConfig } from './envConfig'

export const ENV = asEnvConfig(ENV_JSON)
