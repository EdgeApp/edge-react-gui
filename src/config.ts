import CONFIG_JSON from '../config.json'
import { asConfigJson, type ConfigJson } from './configKeysSchema'

/**
 * Immutable non-secret settings from `config.json`. Never updated by remote
 * appKeys overlays.
 */
export const CONFIG: ConfigJson = asConfigJson.withRest(CONFIG_JSON)
